<?php
/**
 * Rootwood Group — Admin Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/orders.php';
require_once __DIR__ . '/catalog.php';

function handle_admin(string $subpath, string $method): void {
    require_admin();
    $pdo = get_db();

    // 1. Dashboard Summary: GET /summary
    if ($subpath === '/summary' && $method === 'GET') {
        // Revenue counts every order that has moved past payment.
        $revStmt = $pdo->query("
            SELECT COUNT(*) AS paid_count, COALESCE(SUM(total), 0) AS rev
            FROM orders
            WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        ");
        $revRow = $revStmt->fetch();

        // Registered customers (the role column is the source of truth).
        $customersCount = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER'")->fetchColumn();

        // Open tickets
        $tickStmt = $pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status != 'RESOLVED'");
        $openTickets = (int)$tickStmt->fetchColumn();

        // Orders by status
        $obsStmt = $pdo->query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status");
        $obsRows = $obsStmt->fetchAll();
        $ordersByStatus = [
            'PENDING' => 0,
            'PAID' => 0,
            'PROCESSING' => 0,
            'SHIPPED' => 0,
            'DELIVERED' => 0,
            'CANCELLED' => 0,
        ];
        foreach ($obsRows as $r) {
            $ordersByStatus[$r['status']] = (int)$r['count'];
        }

        // 7-day sales
        $salesStmt = $pdo->query("
            SELECT DATE(COALESCE(paid_at, updated_at)) AS day, COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
            FROM orders
            WHERE status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
              AND COALESCE(paid_at, updated_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(COALESCE(paid_at, updated_at))
            ORDER BY day ASC
        ");
        $salesByDay = $salesStmt->fetchAll();

        // Low stock products
        $lsStmt = $pdo->query("SELECT id, name, sku, stock, price FROM products WHERE is_active = 1 AND stock <= 3 ORDER BY stock ASC LIMIT 6");
        $lowStock = $lsStmt->fetchAll();

        json_response([
            'revenue' => (int)$revRow['rev'],
            'totalRevenue' => (int)$revRow['rev'],
            'paidOrders' => (int)$revRow['paid_count'],
            'customers' => $customersCount,
            'openTickets' => $openTickets,
            'ordersByStatus' => $ordersByStatus,
            'salesByDay' => $salesByDay,
            'lowStock' => $lowStock,
        ]);
    }

    // 2. Orders List: GET /orders
    if ($subpath === '/orders' && $method === 'GET') {
        $status = trim($_GET['status'] ?? '');
        $search = trim($_GET['search'] ?? '');
        $userId = trim($_GET['userId'] ?? '');
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
        $offset = max(0, (int)($_GET['offset'] ?? 0));

        $where = ['1=1'];
        $params = [];

        if ($status !== '' && $status !== 'ALL') {
            $where[] = 'o.status = ?';
            $params[] = $status;
        }

        if ($search !== '') {
            $where[] = '(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR o.id LIKE ?)';
            $term = "%$search%";
            $params[] = $term; $params[] = $term; $params[] = $term; $params[] = $term; $params[] = $term;
        }

        if ($userId !== '') {
            $where[] = 'o.user_id = ?';
            $params[] = $userId;
        }

        $whereSql = implode(' AND ', $where);

        $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id WHERE $whereSql");
        $cntStmt->execute($params);
        $total = (int)$cntStmt->fetchColumn();

        $sql = "
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE $whereSql
            ORDER BY o.created_at DESC
            LIMIT $limit OFFSET $offset
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $items = array_map(fn($r) => format_order_row($r, $pdo), $rows);

        json_response([
            'items' => $items,
            'orders' => $items,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    // 3. Update Order Status / Details: PATCH /orders/{id}/status or PATCH /orders/{id}
    if ((preg_match('#^/orders/([a-zA-Z0-9_\-]+)/status$#', $subpath, $matches) ||
         preg_match('#^/orders/([a-zA-Z0-9_\-]+)$#', $subpath, $matches)) && $method === 'PATCH') {
        $orderId = $matches[1];
        $body = get_json_input();
        $newStatus = trim($body['status'] ?? '');

        $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $current = $stmt->fetch();

        if (!$current) {
            json_error('سفارش پیدا نشد', 404);
        }

        $pdo->beginTransaction();
        try {
            if ($newStatus !== '') {
                $allowed = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
                if (!in_array($newStatus, $allowed, true)) {
                    json_error('وضعیت انتخابی نامعتبر است', 400);
                }

                // If transitioning to CANCELLED from PENDING, PAID, or PROCESSING, restore inventory
                if ($newStatus === 'CANCELLED' && in_array($current['status'], ['PENDING', 'PAID', 'PROCESSING'], true)) {
                    $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
                    $itemStmt->execute([$orderId]);
                    $items = $itemStmt->fetchAll();

                    foreach ($items as $it) {
                        $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?")->execute([(int)$it['quantity'], $it['product_id']]);
                    }
                }

                if ($newStatus === 'PAID') {
                    $pdo->prepare("UPDATE orders SET status = ?, paid_at = COALESCE(paid_at, NOW()) WHERE id = ?")
                        ->execute([$newStatus, $orderId]);
                } else {
                    $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$newStatus, $orderId]);
                }
            }

            if (isset($body['note'])) {
                $pdo->prepare("UPDATE orders SET note = ? WHERE id = ?")->execute([trim((string)$body['note']), $orderId]);
            }

            if (isset($body['trackingCode']) || isset($body['paymentTrackId'])) {
                $tc = trim((string)($body['trackingCode'] ?? $body['paymentTrackId'] ?? ''));
                $pdo->prepare("UPDATE orders SET payment_track_id = ? WHERE id = ?")->execute([$tc, $orderId]);
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error('خطا در به‌روزرسانی سفارش: ' . $e->getMessage(), 500);
        }

        json_response(['success' => true, 'status' => $newStatus ?: $current['status']]);
    }

    // 4. Admin Products List (includes archived products)
    if ($subpath === '/products' && $method === 'GET') {
        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? 'all');
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $offset = max(0, (int)($_GET['offset'] ?? 0));

        $where = ['1=1'];
        $params = [];

        if ($search !== '') {
            $where[] = '(p.name LIKE ? OR p.sku LIKE ?)';
            $term = "%$search%";
            $params[] = $term;
            $params[] = $term;
        }

        if ($status === 'active') {
            $where[] = 'p.is_active = 1';
        } elseif ($status === 'archived') {
            $where[] = 'p.is_active = 0';
        }

        $whereSql = implode(' AND ', $where);

        $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM products p WHERE $whereSql");
        $cntStmt->execute($params);
        $total = (int)$cntStmt->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE $whereSql
            ORDER BY p.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);

        $items = array_map(fn($r) => format_product_row($r, $pdo), $stmt->fetchAll());
        json_response([
            'items' => $items,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    // 4. Products CRUD for Admin
    // 4.1 Create Product: POST /products
    if ($subpath === '/products' && $method === 'POST') {
        $body = get_json_input();

        $id = generate_uuid();
        $name = trim($body['name'] ?? $body['title'] ?? '');
        $slug = trim($body['slug'] ?? '');
        $price = (int)($body['price'] ?? 0);
        $sku = trim($body['sku'] ?? ('RW-' . random_int(1000, 9999)));
        $catId = trim($body['categoryId'] ?? '');
        $stock = (int)($body['stock'] ?? 0);

        if (!$name || $price <= 0 || !$catId) {
            json_error('نام اثر، دسته‌بندی و قیمت الزامی است', 400);
        }

        if (!$slug) {
            $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9\x{0600}-\x{06FF}]+/u', '-', $name), '-')) . '-' . substr($id, 0, 4);
        }

        $stmt = $pdo->prepare("
            INSERT INTO products (id, slug, name, tagline, description, price, compare_at, sku, stock, category_id, wood_type, finish, dimensions, weight_kg, featured, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id,
            $slug,
            $name,
            $body['tagline'] ?? $body['shortDescription'] ?? null,
            $body['description'] ?? '',
            $price,
            !empty($body['compareAt']) ? (int)$body['compareAt'] : (!empty($body['originalPrice']) ? (int)$body['originalPrice'] : null),
            $sku,
            $stock,
            $catId,
            $body['woodType'] ?? null,
            $body['finish'] ?? 'روغن گیاهی ارگانیک',
            $body['dimensions'] ?? null,
            !empty($body['weightKg']) ? (float)$body['weightKg'] : null,
            !empty($body['featured']) ? 1 : 0,
            isset($body['isActive']) ? ($body['isActive'] ? 1 : 0) : 1
        ]);

        $imgs = $body['images'] ?? [];
        if (empty($imgs) && !empty($body['imageUrl'])) {
            $imgs = [$body['imageUrl']];
        }
        if (is_array($imgs)) {
            $imgStmt = $pdo->prepare("INSERT INTO product_images (id, product_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)");
            foreach ($imgs as $idx => $imgUrl) {
                if (is_string($imgUrl) && trim($imgUrl) !== '') {
                    $imgStmt->execute([generate_uuid(), $id, trim($imgUrl), $name, $idx + 1]);
                }
            }
        }

        $fStmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        ");
        $fStmt->execute([$id]);
        $row = $fStmt->fetch();

        $productData = $row ? format_product_row($row, $pdo) : ['id' => $id, 'slug' => $slug];
        json_response(['id' => $id, 'slug' => $slug, 'product' => $productData, 'success' => true], 201);
    }

    // 4.2 Update Product: PATCH /products/{id}
    if (preg_match('#^/products/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'PATCH') {
        $id = $matches[1];
        $body = get_json_input();

        $fields = [];
        $params = [];

        if (isset($body['name'])) { $fields[] = 'name = ?'; $params[] = trim($body['name']); }
        if (isset($body['title']) && !isset($body['name'])) { $fields[] = 'name = ?'; $params[] = trim($body['title']); }
        if (isset($body['slug'])) { $fields[] = 'slug = ?'; $params[] = trim($body['slug']); }
        if (isset($body['price'])) { $fields[] = 'price = ?'; $params[] = (int)$body['price']; }
        if (array_key_exists('compareAt', $body)) { $fields[] = 'compare_at = ?'; $params[] = $body['compareAt'] ? (int)$body['compareAt'] : null; }
        if (isset($body['stock'])) { $fields[] = 'stock = ?'; $params[] = (int)$body['stock']; }
        if (isset($body['categoryId'])) { $fields[] = 'category_id = ?'; $params[] = trim($body['categoryId']); }
        if (isset($body['woodType'])) { $fields[] = 'wood_type = ?'; $params[] = trim($body['woodType']); }
        if (isset($body['finish'])) { $fields[] = 'finish = ?'; $params[] = trim($body['finish']); }
        if (isset($body['dimensions'])) { $fields[] = 'dimensions = ?'; $params[] = trim($body['dimensions']); }
        if (isset($body['weightKg'])) { $fields[] = 'weight_kg = ?'; $params[] = $body['weightKg'] ? (float)$body['weightKg'] : null; }
        if (isset($body['isActive'])) { $fields[] = 'is_active = ?'; $params[] = $body['isActive'] ? 1 : 0; }
        if (isset($body['featured'])) { $fields[] = 'featured = ?'; $params[] = $body['featured'] ? 1 : 0; }
        if (isset($body['description'])) { $fields[] = 'description = ?'; $params[] = $body['description']; }
        if (isset($body['tagline'])) { $fields[] = 'tagline = ?'; $params[] = $body['tagline']; }

        if (!empty($fields)) {
            $params[] = $id;
            $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
            $pdo->prepare($sql)->execute($params);
        }

        if (isset($body['images']) || isset($body['imageUrl'])) {
            $imgs = $body['images'] ?? ($body['imageUrl'] ? [$body['imageUrl']] : []);
            if (is_array($imgs) && !empty($imgs)) {
                $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);
                $imgStmt = $pdo->prepare("INSERT INTO product_images (id, product_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)");
                foreach ($imgs as $idx => $u) {
                    if (is_string($u) && trim($u) !== '') {
                        $imgStmt->execute([generate_uuid(), $id, trim($u), 'تصویر اثر', $idx + 1]);
                    }
                }
            }
        }

        $fStmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        ");
        $fStmt->execute([$id]);
        $row = $fStmt->fetch();

        json_response([
            'id' => $id,
            'product' => $row ? format_product_row($row, $pdo) : null,
            'success' => true
        ]);
    }

    // 4.3 Delete Product: DELETE /products/{id}
    if (preg_match('#^/products/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'DELETE') {
        $id = $matches[1];

        // Check if product was purchased in past orders
        $chk = $pdo->prepare("SELECT COUNT(*) FROM order_items WHERE product_id = ?");
        $chk->execute([$id]);
        $orderCount = (int)$chk->fetchColumn();

        if ($orderCount > 0) {
            // Soft delete/archive to preserve order history integrity
            $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?")->execute([$id]);
            json_response([
                'success' => true,
                'action' => 'archived',
                'message' => 'این اثر به دلیل ثبت در سوابق سفارش‌های گذشته بایگانی شد و از فروشگاه خارج گردید.'
            ]);
        } else {
            $pdo->prepare("DELETE FROM cart_items WHERE product_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM reviews WHERE product_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);
            json_response([
                'success' => true,
                'action' => 'deleted',
                'message' => 'اثر با موفقیت به طور کامل از سیستم حذف گردید.'
            ]);
        }
    }

    // 5. Review Moderation
    // 5.1 Review Moderation List: GET /reviews
    if ($subpath === '/reviews' && $method === 'GET') {
        $stmt = $pdo->query("
            SELECT r.*, p.name AS product_name, p.slug AS product_slug
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            ORDER BY r.created_at DESC
        ");
        $rows = $stmt->fetchAll();

        $items = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'productId' => $r['product_id'],
                'productName' => $r['product_name'],
                'productSlug' => $r['product_slug'],
                'authorName' => $r['author_name'],
                'rating' => (int)$r['rating'],
                'title' => $r['title'],
                'comment' => $r['comment'],
                'verifiedPurchase' => (bool)$r['verified_purchase'],
                'isVerifiedPurchase' => (bool)$r['verified_purchase'],
                'approved' => (bool)$r['approved'],
                'createdAt' => $r['created_at'],
            ];
        }, $rows);

        json_response($items);
    }

    // 5.2 Review Moderation Action: PATCH /reviews/{id}/approval
    if (preg_match('#^/reviews/([a-zA-Z0-9_\-]+)/approval$#', $subpath, $matches) && $method === 'PATCH') {
        $reviewId = $matches[1];
        $body = get_json_input();
        $approved = !empty($body['approved']) ? 1 : 0;

        $pdo->prepare("UPDATE reviews SET approved = ? WHERE id = ?")->execute([$approved, $reviewId]);
        json_response(['success' => true, 'approved' => (bool)$approved]);
    }

    // 5.3 Review Delete: DELETE /reviews/{id}
    if (preg_match('#^/reviews/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'DELETE') {
        $reviewId = $matches[1];
        $pdo->prepare("DELETE FROM reviews WHERE id = ?")->execute([$reviewId]);
        json_response(['success' => true]);
    }

    // 6. Contact Tickets & Bespoke Inquiries
    // 6.1 Contact Tickets List: GET /contact
    if ($subpath === '/contact' && $method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $items = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'userId' => $r['user_id'],
                'name' => $r['name'],
                'email' => $r['email'],
                'phone' => $r['phone'],
                'subject' => $r['subject'],
                'message' => $r['message'],
                'status' => $r['status'], // 'NEW', 'IN_PROGRESS', 'RESOLVED'
                'createdAt' => $r['created_at'],
                'updatedAt' => $r['updated_at'],
            ];
        }, $rows);
        json_response($items);
    }

    // 6.2 Update Contact Status: PATCH /contact/{id}/status
    if (preg_match('#^/contact/([a-zA-Z0-9_\-]+)/status$#', $subpath, $matches) && $method === 'PATCH') {
        $msgId = $matches[1];
        $body = get_json_input();
        $rawStatus = strtoupper(trim((string)($body['status'] ?? 'RESOLVED')));

        // Map friendly/legacy front-end status names into valid database enum ('NEW', 'IN_PROGRESS', 'RESOLVED')
        $statusMap = [
            'NEW' => 'NEW',
            'READ' => 'IN_PROGRESS',
            'IN_PROGRESS' => 'IN_PROGRESS',
            'REPLIED' => 'RESOLVED',
            'RESOLVED' => 'RESOLVED',
        ];
        $newStatus = $statusMap[$rawStatus] ?? 'RESOLVED';

        $pdo->prepare("UPDATE contact_messages SET status = ? WHERE id = ?")->execute([$newStatus, $msgId]);
        json_response(['success' => true, 'status' => $newStatus]);
    }

    // 6.3 Delete Contact Message: DELETE /contact/{id}
    if (preg_match('#^/contact/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'DELETE') {
        $msgId = $matches[1];
        $pdo->prepare("DELETE FROM contact_messages WHERE id = ?")->execute([$msgId]);
        json_response(['success' => true]);
    }

    // 7. Customers / Users List: GET /customers
    if ($subpath === '/customers' && $method === 'GET') {
        $stmt = $pdo->query("
            SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
                   COUNT(DISTINCT o.id) AS order_count,
                   COALESCE(SUM(CASE WHEN o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED') THEN o.total ELSE 0 END), 0) AS total_spent,
                   MAX(o.created_at) AS last_order_at
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            GROUP BY u.id, u.name, u.email, u.phone, u.role, u.created_at
            ORDER BY u.created_at DESC
        ");
        $rows = $stmt->fetchAll();
        $customers = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'name' => $r['name'],
                'email' => $r['email'],
                'phone' => $r['phone'],
                'role' => ($r['role'] ?? 'CUSTOMER') === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
                'createdAt' => $r['created_at'],
                'lastOrderAt' => $r['last_order_at'],
                'orderCount' => (int)$r['order_count'],
                'totalSpent' => (int)$r['total_spent'],
            ];
        }, $rows);
        json_response($customers);
    }

    // 8. Image Upload with 1MB Limit: POST /upload
    if ($subpath === '/upload' && $method === 'POST') {
        $file = $_FILES['file'] ?? $_FILES['image'] ?? null;
        if (!$file || !isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
            json_error('فایل تصویر دریافت نشد یا خطایی در ارسال رخ داد', 400);
        }

        // 1MB limit = 1024 * 1024 bytes (1,048,576 bytes)
        $maxBytes = 1024 * 1024;
        if ($file['size'] > $maxBytes) {
            json_error('حجم تصویر بیش از حد مجاز است. حداکثر حجم فایل ۱ مگابایت است', 400);
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/svg+xml' => 'svg',
        ];

        if (!isset($allowedMimes[$mime])) {
            json_error('فرمت فایل مجاز نیست. لطفاً تصویر با فرمت JPG، PNG، WEBP یا GIF انتخاب کنید', 400);
        }

        $ext = $allowedMimes[$mime];
        $uploadDir = __DIR__ . '/uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = 'rw_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $targetPath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            json_error('خطا در ذخیره‌سازی فایل در سرور', 500);
        }

        json_response([
            'success' => true,
            'url' => '/api/uploads/' . $filename,
            'filename' => $filename,
            'size' => $file['size'],
            'mime' => $mime,
        ]);
    }

    // 9. Blog / Articles Management
    // 9.1 Posts List: GET /blog/posts or GET /posts
    if (($subpath === '/blog/posts' || $subpath === '/posts') && $method === 'GET') {
        $q = trim($_GET['q'] ?? '');
        $status = trim($_GET['status'] ?? '');
        $where = ['1=1'];
        $params = [];

        if ($q !== '') {
            $where[] = '(p.title LIKE ? OR p.excerpt LIKE ? OR p.slug LIKE ?)';
            $term = "%$q%";
            $params[] = $term; $params[] = $term; $params[] = $term;
        }

        if ($status === 'PUBLISHED') {
            $where[] = 'p.published = 1';
        } elseif ($status === 'DRAFT') {
            $where[] = 'p.published = 0';
        }

        $whereSql = implode(' AND ', $where);

        $stmt = $pdo->prepare("
            SELECT p.*, u.name AS author_name
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE $whereSql
            ORDER BY p.created_at DESC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $posts = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'slug' => $r['slug'],
                'title' => $r['title'],
                'excerpt' => $r['excerpt'],
                'content' => $r['content'],
                'coverImage' => $r['cover_image'],
                'published' => (bool)$r['published'],
                'tags' => json_decode($r['tags'] ?: '[]', true) ?: [],
                'author' => ['name' => $r['author_name'] ?? 'مدیر کارگاه'],
                'createdAt' => $r['created_at'],
                'updatedAt' => $r['updated_at'],
            ];
        }, $rows);

        json_response($posts);
    }

    // 9.2 Create Post: POST /blog/posts or POST /posts
    if (($subpath === '/blog/posts' || $subpath === '/posts') && $method === 'POST') {
        $body = get_json_input();
        $title = trim((string)($body['title'] ?? ''));
        if ($title === '') {
            json_error('عنوان مقاله الزامی است', 400);
        }

        $slug = trim((string)($body['slug'] ?? ''));
        if ($slug === '') {
            $slug = preg_replace('/[^\p{L}\p{N}]+/u', '-', mb_strtolower($title));
            $slug = trim($slug, '-') ?: ('post-' . time());
        }

        // Check unique slug
        $chk = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE slug = ?");
        $chk->execute([$slug]);
        if ((int)$chk->fetchColumn() > 0) {
            $slug .= '-' . substr(bin2hex(random_bytes(3)), 0, 4);
        }

        $excerpt = trim((string)($body['excerpt'] ?? ''));
        $content = trim((string)($body['content'] ?? ''));
        $coverImage = trim((string)($body['coverImage'] ?? ''));
        $published = !empty($body['published']) ? 1 : 0;
        $rawTags = $body['tags'] ?? [];
        $tags = is_array($rawTags) ? $rawTags : array_values(array_filter(array_map('trim', explode(',', (string)$rawTags))));
        $tagsJson = json_encode($tags, JSON_UNESCAPED_UNICODE);

        $adminUser = require_admin();
        $authorId = $adminUser['id'];
        $postId = generate_uuid();

        $stmt = $pdo->prepare("
            INSERT INTO posts (id, slug, title, excerpt, content, cover_image, author_id, published, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([$postId, $slug, $title, $excerpt, $content, $coverImage, $authorId, $published, $tagsJson]);

        json_response([
            'success' => true,
            'id' => $postId,
            'slug' => $slug,
            'message' => 'مقاله جدید با موفقیت ذخیره شد',
        ]);
    }

    // 9.3 Update Post: PUT or PATCH /blog/posts/{id}
    if (preg_match('#^/(?:blog/posts|posts)/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $postId = $matches[1];
        $body = get_json_input();
        $title = trim((string)($body['title'] ?? ''));
        if ($title === '') {
            json_error('عنوان مقاله الزامی است', 400);
        }

        $slug = trim((string)($body['slug'] ?? ''));
        if ($slug !== '') {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE slug = ? AND id != ?");
            $chk->execute([$slug, $postId]);
            if ((int)$chk->fetchColumn() > 0) {
                json_error('نامک (slug) وارد شده قبلاً برای مقاله دیگری استفاده شده است', 400);
            }
        }

        $excerpt = trim((string)($body['excerpt'] ?? ''));
        $content = trim((string)($body['content'] ?? ''));
        $coverImage = trim((string)($body['coverImage'] ?? ''));
        $published = isset($body['published']) ? (!empty($body['published']) ? 1 : 0) : null;
        $rawTags = $body['tags'] ?? null;
        $tags = is_array($rawTags) ? $rawTags : ($rawTags !== null ? array_values(array_filter(array_map('trim', explode(',', (string)$rawTags)))) : null);

        $setSql = "title = ?, excerpt = ?, content = ?, cover_image = ?, updated_at = NOW()";
        $params = [$title, $excerpt, $content, $coverImage];

        if ($slug !== '') {
            $setSql .= ", slug = ?";
            $params[] = $slug;
        }

        if ($published !== null) {
            $setSql .= ", published = ?";
            $params[] = $published;
        }

        if ($tags !== null) {
            $setSql .= ", tags = ?";
            $params[] = json_encode($tags, JSON_UNESCAPED_UNICODE);
        }

        $params[] = $postId;
        $stmt = $pdo->prepare("UPDATE posts SET $setSql WHERE id = ?");
        $stmt->execute($params);

        json_response([
            'success' => true,
            'id' => $postId,
            'message' => 'مقاله به‌روزرسانی شد',
        ]);
    }

    // 9.4 Toggle Post Publish: PATCH /blog/posts/{id}/publish
    if (preg_match('#^/(?:blog/posts|posts)/([a-zA-Z0-9_\-]+)/publish$#', $subpath, $matches) && $method === 'PATCH') {
        $postId = $matches[1];
        $body = get_json_input();
        $published = !empty($body['published']) ? 1 : 0;

        $pdo->prepare("UPDATE posts SET published = ?, updated_at = NOW() WHERE id = ?")->execute([$published, $postId]);
        json_response(['success' => true, 'published' => (bool)$published]);
    }

    // 9.5 Delete Post: DELETE /blog/posts/{id}
    if (preg_match('#^/(?:blog/posts|posts)/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'DELETE') {
        $postId = $matches[1];
        $pdo->prepare("DELETE FROM posts WHERE id = ?")->execute([$postId]);
        json_response(['success' => true, 'message' => 'مقاله حذف شد']);
    }

    json_error('مسیر مدیریت پیدا نشد', 404);
}
