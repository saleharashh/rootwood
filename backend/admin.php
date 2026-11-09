<?php
/**
 * Rootwood Group — Admin Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/orders.php';

function handle_admin(string $subpath, string $method): void {
    require_admin();
    $pdo = get_db();

    // 1. Dashboard Summary: GET /summary
    if ($subpath === '/summary' && $method === 'GET') {
        // Revenue & paid orders
        $revStmt = $pdo->query("SELECT COUNT(*) AS paid_count, COALESCE(SUM(total), 0) AS rev FROM orders WHERE status = 'PAID'");
        $revRow = $revStmt->fetch();

        // Total customers
        $custStmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER'");
        $customersCount = (int)$custStmt->fetchColumn();

        // Open tickets
        $tickStmt = $pdo->query("SELECT COUNT(*) FROM contact_messages WHERE status != 'RESOLVED'");
        $openTickets = (int)$tickStmt->fetchColumn();

        // Orders by status
        $obsStmt = $pdo->query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status");
        $obsRows = $obsStmt->fetchAll();
        $ordersByStatus = [
            'PENDING' => 0,
            'PAID' => 0,
            'SHIPPED' => 0,
            'DELIVERED' => 0,
            'CANCELLED' => 0,
        ];
        foreach ($obsRows as $r) {
            $ordersByStatus[$r['status']] = (int)$r['count'];
        }

        // 7-day sales
        $salesStmt = $pdo->query("
            SELECT DATE(paid_at) AS day, COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
            FROM orders
            WHERE status = 'PAID' AND paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(paid_at)
            ORDER BY day ASC
        ");
        $salesByDay = $salesStmt->fetchAll();

        // Low stock products
        $lsStmt = $pdo->query("SELECT id, name, sku, stock, price FROM products WHERE is_active = 1 AND stock <= 3 ORDER BY stock ASC LIMIT 5");
        $lowStock = $lsStmt->fetchAll();

        json_response([
            'revenue' => (int)$revRow['rev'],
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
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $offset = max(0, (int)($_GET['offset'] ?? 0));

        $where = ['1=1'];
        $params = [];

        if ($status !== '') {
            $where[] = 'o.status = ?';
            $params[] = $status;
        }

        if ($search !== '') {
            $where[] = '(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
            $term = "%$search%";
            $params[] = $term; $params[] = $term; $params[] = $term; $params[] = $term;
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
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    // 3. Update Order Status: PATCH /orders/{id}/status
    if (preg_match('#^/orders/([a-zA-Z0-9_\-]+)/status$#', $subpath, $matches) && $method === 'PATCH') {
        $orderId = $matches[1];
        $body = get_json_input();
        $newStatus = trim($body['status'] ?? '');

        $allowed = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!in_array($newStatus, $allowed, true)) {
            json_error('وضعیت انتخابی نامعتبر است', 400);
        }

        $stmt = $pdo->prepare("SELECT status FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $current = $stmt->fetch();

        if (!$current) {
            json_error('سفارش پیدا نشد', 404);
        }

        $pdo->beginTransaction();
        try {
            // If transitioning to CANCELLED from PENDING, PAID, or PROCESSING, restore inventory
            if ($newStatus === 'CANCELLED' && in_array($current['status'], ['PENDING', 'PAID', 'PROCESSING'], true)) {
                $itemStmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
                $itemStmt->execute([$orderId]);
                $items = $itemStmt->fetchAll();

                foreach ($items as $it) {
                    $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?")->execute([(int)$it['quantity'], $it['product_id']]);
                }
            }

            $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?")->execute([$newStatus, $orderId]);
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error('خطا در به‌روزرسانی وضعیت', 500);
        }

        json_response(['success' => true, 'status' => $newStatus]);
    }

    // 4. Review Moderation List: GET /reviews
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
                'approved' => (bool)$r['approved'],
                'createdAt' => $r['created_at'],
            ];
        }, $rows);

        json_response($items);
    }

    // 5. Review Moderation Action: PATCH /reviews/{id}/approval
    if (preg_match('#^/reviews/([a-zA-Z0-9_\-]+)/approval$#', $subpath, $matches) && $method === 'PATCH') {
        $reviewId = $matches[1];
        $body = get_json_input();
        $approved = !empty($body['approved']) ? 1 : 0;

        $pdo->prepare("UPDATE reviews SET approved = ? WHERE id = ?")->execute([$approved, $reviewId]);
        json_response(['success' => true, 'approved' => (bool)$approved]);
    }

    // 6. Contact Tickets: GET /contact
    if ($subpath === '/contact' && $method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC");
        json_response($stmt->fetchAll());
    }

    // 7. Update Contact Status: PATCH /contact/{id}/status
    if (preg_match('#^/contact/([a-zA-Z0-9_\-]+)/status$#', $subpath, $matches) && $method === 'PATCH') {
        $msgId = $matches[1];
        $body = get_json_input();
        $newStatus = trim($body['status'] ?? 'RESOLVED');

        $pdo->prepare("UPDATE contact_messages SET status = ? WHERE id = ?")->execute([$newStatus, $msgId]);
        json_response(['success' => true, 'status' => $newStatus]);
    }

    json_error('مسیر مدیریت پیدا نشد', 404);
}
