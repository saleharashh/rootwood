<?php
/**
 * Rootwood Group — Cart Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

const FREE_SHIPPING_THRESHOLD = 5000000; // 5,000,000 Toman
const SHIPPING_FLAT = 250000; // 250,000 Toman

function get_cart_session_id(): ?string {
    $sid = $_SERVER['HTTP_X_CART_SESSION'] 
        ?? $_SERVER['HTTP_X_SESSION_ID'] 
        ?? $_COOKIE['craftedroot_cart_session'] 
        ?? null;
    return ($sid && trim($sid) !== '') ? trim($sid) : null;
}

function find_or_create_cart(PDO $pdo, ?array $user, ?string $sessionId): array {
    if ($user) {
        $stmt = $pdo->prepare("SELECT * FROM carts WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $cart = $stmt->fetch();
        if (!$cart) {
            $cartId = generate_uuid();
            $pdo->prepare("INSERT INTO carts (id, user_id) VALUES (?, ?)")->execute([$cartId, $user['id']]);
            return ['id' => $cartId, 'user_id' => $user['id'], 'session_id' => null];
        }
        return $cart;
    }

    if (!$sessionId) {
        $sessionId = 'guest_' . bin2hex(random_bytes(16));
    }

    $stmt = $pdo->prepare("SELECT * FROM carts WHERE session_id = ?");
    $stmt->execute([$sessionId]);
    $cart = $stmt->fetch();
    if (!$cart) {
        $cartId = generate_uuid();
        $pdo->prepare("INSERT INTO carts (id, session_id) VALUES (?, ?)")->execute([$cartId, $sessionId]);
        return ['id' => $cartId, 'user_id' => null, 'session_id' => $sessionId];
    }
    return $cart;
}

function get_cart_view(PDO $pdo, string $cartId): array {
    $stmt = $pdo->prepare("
        SELECT ci.id AS item_id, ci.quantity, p.id AS product_id, p.slug, p.name, p.price, p.stock, p.is_active,
               (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at ASC
    ");
    $stmt->execute([$cartId]);
    $rows = $stmt->fetchAll();

    $items = [];
    $subtotal = 0;
    $itemCount = 0;

    foreach ($rows as $r) {
        $price = (int)$r['price'];
        $qty = (int)$r['quantity'];
        $lineTotal = $price * $qty;
        $subtotal += $lineTotal;
        $itemCount += $qty;

        $items[] = [
            'id' => $r['item_id'],
            'productId' => $r['product_id'],
            'quantity' => $qty,
            'lineTotal' => $lineTotal,
            'product' => [
                'id' => $r['product_id'],
                'slug' => $r['slug'],
                'name' => $r['name'],
                'price' => $price,
                'stock' => (int)$r['stock'],
                'isActive' => (bool)$r['is_active'],
                'images' => [
                    ['url' => $r['image_url'] ?? '/images/workshop.webp', 'alt' => $r['name']]
                ],
            ]
        ];
    }

    $shipping = ($subtotal >= FREE_SHIPPING_THRESHOLD || $subtotal === 0) ? 0 : SHIPPING_FLAT;
    $total = $subtotal + $shipping;

    $summary = [
        'subtotal' => $subtotal,
        'shipping' => $shipping,
        'total' => $total,
        'itemCount' => $itemCount,
        'freeShippingThreshold' => FREE_SHIPPING_THRESHOLD,
    ];

    return [
        'id' => $cartId,
        'items' => $items,
        'summary' => $summary,
        'subtotal' => $subtotal,
        'shipping' => $shipping,
        'total' => $total,
        'itemCount' => $itemCount,
    ];
}

function handle_cart(string $subpath, string $method): void {
    $pdo = get_db();
    $user = get_auth_user();
    $sessionId = get_cart_session_id();

    $cart = find_or_create_cart($pdo, $user, $sessionId);

    // 1. Get Cart
    if (($subpath === '' || $subpath === '/') && $method === 'GET') {
        json_response(get_cart_view($pdo, $cart['id']));
    }

    // 2. Add Item: POST /items
    if ($subpath === '/items' && $method === 'POST') {
        $body = get_json_input();
        $productId = trim($body['productId'] ?? '');
        $quantity = max(1, (int)($body['quantity'] ?? 1));

        if (!$productId) {
            json_error('شناسه محصول الزامی است', 400);
        }

        $pStmt = $pdo->prepare("SELECT id, name, price, stock, is_active FROM products WHERE id = ?");
        $pStmt->execute([$productId]);
        $prod = $pStmt->fetch();

        if (!$prod || !$prod['is_active']) {
            json_error('این محصول در دسترس نیست', 404);
        }

        // Check if already in cart
        $ciStmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?");
        $ciStmt->execute([$cart['id'], $productId]);
        $existing = $ciStmt->fetch();

        $targetQty = $existing ? ((int)$existing['quantity'] + $quantity) : $quantity;
        if ($targetQty > (int)$prod['stock']) {
            json_error(sprintf('موجودی انبار برای «%s» کافی نیست (موجودی: %d عدد)', $prod['name'], (int)$prod['stock']), 400);
        }

        if ($existing) {
            $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?")->execute([$targetQty, $existing['id']]);
        } else {
            $pdo->prepare("INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)")
                ->execute([generate_uuid(), $cart['id'], $productId, $quantity]);
        }

        json_response(get_cart_view($pdo, $cart['id']));
    }

    // 3. Update Item Quantity: PATCH /items/{id}
    if (preg_match('#^/items/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'PATCH') {
        $itemId = $matches[1];
        $body = get_json_input();
        $quantity = (int)($body['quantity'] ?? 1);

        if ($quantity <= 0) {
            $pdo->prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?")->execute([$itemId, $cart['id']]);
            json_response(get_cart_view($pdo, $cart['id']));
        }

        $stmt = $pdo->prepare("
            SELECT ci.id, p.name, p.stock 
            FROM cart_items ci 
            JOIN products p ON ci.product_id = p.id 
            WHERE ci.id = ? AND ci.cart_id = ?
        ");
        $stmt->execute([$itemId, $cart['id']]);
        $item = $stmt->fetch();

        if (!$item) {
            json_error('آیتم در سبد خرید پیدا نشد', 404);
        }

        if ($quantity > (int)$item['stock']) {
            json_error(sprintf('موجودی انبار برای «%s» کافی نیست', $item['name']), 400);
        }

        $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?")->execute([$quantity, $itemId]);
        json_response(get_cart_view($pdo, $cart['id']));
    }

    // 4. Delete Item: DELETE /items/{id}
    if (preg_match('#^/items/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'DELETE') {
        $itemId = $matches[1];
        $pdo->prepare("DELETE FROM cart_items WHERE id = ? AND cart_id = ?")->execute([$itemId, $cart['id']]);
        json_response(get_cart_view($pdo, $cart['id']));
    }

    // 5. Merge Guest Cart to User Account: POST /merge
    if ($subpath === '/merge' && $method === 'POST') {
        $user = require_auth();
        $body = get_json_input();
        $guestSessionId = trim($body['sessionId'] ?? ($sessionId ?? ''));

        if ($guestSessionId) {
            $gCartStmt = $pdo->prepare("SELECT id FROM carts WHERE session_id = ?");
            $gCartStmt->execute([$guestSessionId]);
            $guestCart = $gCartStmt->fetch();

            if ($guestCart) {
                // Get guest items
                $itemsStmt = $pdo->prepare("SELECT product_id, quantity FROM cart_items WHERE cart_id = ?");
                $itemsStmt->execute([$guestCart['id']]);
                $guestItems = $itemsStmt->fetchAll();

                $uCart = find_or_create_cart($pdo, $user, null);

                foreach ($guestItems as $gi) {
                    $uItemStmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?");
                    $uItemStmt->execute([$uCart['id'], $gi['product_id']]);
                    $existing = $uItemStmt->fetch();

                    if ($existing) {
                        $newQty = (int)$existing['quantity'] + (int)$gi['quantity'];
                        $pdo->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?")->execute([$newQty, $existing['id']]);
                    } else {
                        $pdo->prepare("INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)")
                            ->execute([generate_uuid(), $uCart['id'], $gi['product_id'], (int)$gi['quantity']]);
                    }
                }

                // Delete guest cart
                $pdo->prepare("DELETE FROM carts WHERE id = ?")->execute([$guestCart['id']]);
            }
        }

        $userCart = find_or_create_cart($pdo, $user, null);
        json_response(get_cart_view($pdo, $userCart['id']));
    }

    json_error('مسیر سبد خرید پیدا نشد', 404);
}
