<?php
/**
 * Rootwood Group — Orders Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function format_order_row(array $order, PDO $pdo): array {
    $itemStmt = $pdo->prepare("
        SELECT oi.*, 
               (SELECT url FROM product_images WHERE product_id = oi.product_id ORDER BY sort_order ASC LIMIT 1) AS image_url
        FROM order_items oi
        WHERE oi.order_id = ?
    ");
    $itemStmt->execute([$order['id']]);
    $items = $itemStmt->fetchAll();

    $itemsFormatted = array_map(function ($it) {
        return [
            'id' => $it['id'],
            'productId' => $it['product_id'],
            'name' => $it['name'],
            'unitPrice' => (int)$it['unit_price'],
            'quantity' => (int)$it['quantity'],
            'product' => [
                'id' => $it['product_id'],
                'images' => [
                    ['url' => $it['image_url'] ?? '/images/workshop.webp']
                ]
            ]
        ];
    }, $items);

    $address = is_string($order['shipping_address']) ? json_decode($order['shipping_address'], true) : $order['shipping_address'];

    return [
        'id' => $order['id'],
        'orderNumber' => $order['order_number'],
        'userId' => $order['user_id'],
        'email' => $order['email'],
        'status' => $order['status'],
        'subtotal' => (int)$order['subtotal'],
        'shipping' => (int)$order['shipping'],
        'total' => (int)$order['total'],
        'shippingAddress' => $address,
        'note' => $order['note'],
        'paymentGateway' => $order['payment_gateway'],
        'paymentTrackId' => $order['payment_track_id'],
        'paymentRefId' => $order['payment_ref_id'],
        'paidAt' => $order['paid_at'],
        'createdAt' => $order['created_at'],
        'updatedAt' => $order['updated_at'],
        'items' => $itemsFormatted,
        'user' => [
            'name' => $order['user_name'] ?? '',
            'email' => $order['user_email'] ?? $order['email'],
            'phone' => $order['user_phone'] ?? null,
        ]
    ];
}

function handle_orders(string $subpath, string $method): void {
    $pdo = get_db();

    // 0. Public Order Tracking: GET /track?code=...
    if (($subpath === '/track' || $subpath === '/lookup') && $method === 'GET') {
        $code = trim($_GET['code'] ?? $_GET['orderNumber'] ?? $_GET['orderId'] ?? '');
        $rawPhone = trim($_GET['phone'] ?? '');
        $phone = $rawPhone !== '' ? (normalize_iranian_phone($rawPhone) ?? $rawPhone) : '';

        if ($code === '') {
            json_error('کد یا شناسه سفارش الزامی است', 400);
        }

        // Exact identifiers only: a short prefix must never expose another order.
        $where = ['(o.id = ? OR o.order_number = ?)'];
        $params = [$code, $code];

        if ($phone !== '') {
            $where[] = '(u.phone = ? OR JSON_UNQUOTE(JSON_EXTRACT(o.shipping_address, "$.phone")) = ?)';
            $params[] = $phone;
            $params[] = $phone;
        }

        $sql = "
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE " . implode(' AND ', $where) . "
            LIMIT 1
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $order = $stmt->fetch();

        if (!$order) {
            json_error('سفارشی با این مشخصات در سیستم کارگاه یافت نشد', 404);
        }

        $formatted = format_order_row($order, $pdo);
        // Mask personal contact details in public tracking response
        if (!empty($formatted['shippingAddress']['phone'])) {
            $p = (string)$formatted['shippingAddress']['phone'];
            $formatted['shippingAddress']['phone'] = strlen($p) > 7 ? substr($p, 0, 4) . '***' . substr($p, -4) : '***';
        }
        if (!empty($formatted['email'])) {
            $e = (string)$formatted['email'];
            $at = strpos($e, '@');
            $formatted['email'] = $at > 2 ? substr($e, 0, 2) . '***' . substr($e, $at) : '***';
        }
        if (!empty($formatted['shippingAddress']['fullName'])) {
            $name = (string)$formatted['shippingAddress']['fullName'];
            $formatted['shippingAddress']['fullName'] = mb_substr($name, 0, 1) . '***';
            $formatted['shippingAddress']['recipientName'] = $formatted['shippingAddress']['fullName'];
        }
        if (!empty($formatted['shippingAddress']['line1'])) {
            $street = (string)$formatted['shippingAddress']['line1'];
            $formatted['shippingAddress']['line1'] = mb_strlen($street) > 12
                ? mb_substr($street, 0, 12) . '…'
                : $street;
            $formatted['shippingAddress']['street'] = $formatted['shippingAddress']['line1'];
        }

        json_response(['order' => $formatted]);
    }

    $user = require_auth();

    // 1. Create Order: POST /
    if (($subpath === '' || $subpath === '/') && $method === 'POST') {
        $body = get_json_input();
        $shippingAddr = $body['shippingAddress'] ?? null;
        $note = trim((string)($body['note'] ?? $body['customerNote'] ?? '')) ?: null;

        $fullName = trim((string)($shippingAddr['fullName'] ?? $shippingAddr['recipientName'] ?? ''));
        $line1 = trim((string)($shippingAddr['line1'] ?? $shippingAddr['street'] ?? ''));
        $city = trim((string)($shippingAddr['city'] ?? ''));
        $state = trim((string)($shippingAddr['state'] ?? $shippingAddr['province'] ?? ''));
        $postalCode = normalize_postal_code((string)($shippingAddr['postalCode'] ?? ''));
        $phone = normalize_iranian_phone((string)($shippingAddr['phone'] ?? ($user['phone'] ?? '')));

        if (!$shippingAddr || mb_strlen($fullName) < 3 || is_placeholder_name($fullName)) {
            json_error('لطفاً نام و نام خانوادگی تحویل‌گیرنده را به صورت دقیق وارد نمایید', 400);
        }
        if ($phone === null) {
            json_error('لطفاً شماره موبایل معتبر تحویل‌گیرنده (مانند 09123456789) را وارد نمایید', 400);
        }
        if (mb_strlen($state) < 2 || mb_strlen($city) < 2) {
            json_error('لطفاً استان و شهر تحویل را به صورت دقیق وارد نمایید', 400);
        }
        if (mb_strlen($line1) < 10) {
            json_error('لطفاً نشانی دقیق پستی (خیابان، کوچه، پلاک و واحد) را حداقل در ۱۰ کاراکتر وارد نمایید', 400);
        }
        if ($postalCode === null) {
            json_error('کد پستی باید دقیقاً ۱۰ رقم بدون خط تیره باشد', 400);
        }

        // Get user cart items
        $cStmt = $pdo->prepare("
            SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.is_active
            FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            JOIN products p ON ci.product_id = p.id
            WHERE c.user_id = ?
        ");
        $cStmt->execute([$user['id']]);
        $cartItems = $cStmt->fetchAll();

        if (empty($cartItems)) {
            json_error('سبد خرید شما خالی است', 400);
        }

        $orderId = generate_uuid();
        $orderNumber = 'CR-' . strtoupper(base_convert((string)time(), 10, 36)) . '-' . strtoupper(bin2hex(random_bytes(2)));
        
        $pdo->beginTransaction();
        try {
            $subtotal = 0;
            $orderItems = [];

            foreach ($cartItems as $ci) {
                if (!$ci['is_active']) {
                    throw new Exception("محصول «{$ci['name']}» در حال حاضر فعال نیست");
                }

                $qty = (int)$ci['quantity'];
                
                // Atomic stock decrement with row check
                $upStmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ? AND is_active = 1");
                $upStmt->execute([$qty, $ci['product_id'], $qty]);

                if ($upStmt->rowCount() !== 1) {
                    throw new Exception("موجودی «{$ci['name']}» برای ثبت سفارش کافی نیست");
                }

                // Strict server-side price from products table
                $unitPrice = (int)$ci['price'];
                $subtotal += ($unitPrice * $qty);

                $orderItems[] = [
                    'id' => generate_uuid(),
                    'productId' => $ci['product_id'],
                    'name' => $ci['name'],
                    'unitPrice' => $unitPrice,
                    'quantity' => $qty,
                ];
            }

            $shipping = ($subtotal >= 5000000) ? 0 : 250000;
            $total = $subtotal + $shipping;

            $addressJson = json_encode([
                'fullName' => $fullName,
                'recipientName' => $fullName,
                'line1' => $line1,
                'street' => $line1,
                'line2' => trim((string)($shippingAddr['line2'] ?? '')) ?: null,
                'city' => $city,
                'state' => $state,
                'province' => $state,
                'postalCode' => $postalCode,
                'country' => 'IR',
                'phone' => $phone,
            ], JSON_UNESCAPED_UNICODE);

            if (is_placeholder_name($user['name'] ?? null)) {
                $pdo->prepare("UPDATE users SET name = ? WHERE id = ?")->execute([$fullName, $user['id']]);
            }

            $insOrder = $pdo->prepare("
                INSERT INTO orders (id, order_number, user_id, email, status, subtotal, shipping, total, shipping_address, note)
                VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)
            ");
            $insOrder->execute([$orderId, $orderNumber, $user['id'], $user['email'], $subtotal, $shipping, $total, $addressJson, $note]);

            $insItem = $pdo->prepare("
                INSERT INTO order_items (id, order_id, product_id, name, unit_price, quantity)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($orderItems as $oi) {
                $insItem->execute([$oi['id'], $orderId, $oi['productId'], $oi['name'], $oi['unitPrice'], $oi['quantity']]);
            }

            // Save address if requested
            if (!empty($body['saveAddress'])) {
                $cntAddr = $pdo->prepare("SELECT COUNT(*) FROM addresses WHERE user_id = ?");
                $cntAddr->execute([$user['id']]);
                $isDef = ((int)$cntAddr->fetchColumn() === 0) ? 1 : 0;

                $addrStmt = $pdo->prepare("
                    INSERT INTO addresses (id, user_id, full_name, line1, line2, city, state, postal_code, phone, is_default)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $addrStmt->execute([
                    generate_uuid(), $user['id'], $fullName,
                    $line1, trim((string)($shippingAddr['line2'] ?? '')) ?: null,
                    $city, $state,
                    $postalCode, $phone, $isDef
                ]);
            }

            // Clear user cart
            $pdo->prepare("DELETE ci FROM cart_items ci JOIN carts c ON ci.cart_id = c.id WHERE c.user_id = ?")->execute([$user['id']]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error($e->getMessage(), 400);
        }

        // Fetch created order
        $stmt = $pdo->prepare("
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        ");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        $formatted = format_order_row($order, $pdo);
        json_response(array_merge($formatted, ['order' => $formatted]), 201);
    }

    // 2. List Customer Orders: GET /
    if (($subpath === '' || $subpath === '/') && $method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();

        $res = array_map(fn($r) => format_order_row($r, $pdo), $rows);
        json_response($res);
    }

    // 3. Get Single Order: GET /{id} (IDOR Safe: checks ownership)
    if (preg_match('#^/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'GET') {
        $orderId = $matches[1];
        
        $sql = ($user['role'] === 'ADMIN')
            ? "SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?"
            : "SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ? AND o.user_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $params = ($user['role'] === 'ADMIN') ? [$orderId] : [$orderId, $user['id']];
        $stmt->execute($params);
        $order = $stmt->fetch();

        if (!$order) {
            json_error('سفارش مورد نظر پیدا نشد', 404);
        }

        $formatted = format_order_row($order, $pdo);
        json_response(array_merge($formatted, ['order' => $formatted]));
    }

    // 4. Cancel Order: POST /{id}/cancel (Restores reserved stock)
    if (preg_match('#^/([a-zA-Z0-9_\-]+)/cancel$#', $subpath, $matches) && $method === 'POST') {
        $orderId = $matches[1];

        $stmt = $pdo->prepare("SELECT id, status, user_id FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order || ($order['user_id'] !== $user['id'] && $user['role'] !== 'ADMIN')) {
            json_error('سفارش مورد نظر پیدا نشد', 404);
        }

        if ($order['status'] !== 'PENDING') {
            json_error('فقط سفارش‌های در انتظار پرداخت قابل لغو هستند', 400);
        }

        $pdo->beginTransaction();
        try {
            // Restore inventory
            $itemsStmt = $pdo->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?");
            $itemsStmt->execute([$orderId]);
            $items = $itemsStmt->fetchAll();

            foreach ($items as $it) {
                $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?")->execute([(int)$it['quantity'], $it['product_id']]);
            }

            $pdo->prepare("UPDATE orders SET status = 'CANCELLED' WHERE id = ?")->execute([$orderId]);
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error('خطا در لغو سفارش', 500);
        }

        json_response(['success' => true, 'message' => 'سفارش لغو شد و موجودی انبار بازگردانده شد']);
    }

    json_error('مسیر سفارشات پیدا نشد', 404);
}
