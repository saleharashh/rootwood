<?php
/**
 * Rootwood Group — Reviews Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function handle_reviews(string $slug, string $method): void {
    $pdo = get_db();

    $pStmt = $pdo->prepare("SELECT id FROM products WHERE slug = ? OR id = ?");
    $pStmt->execute([$slug, $slug]);
    $prod = $pStmt->fetch();

    if (!$prod) {
        json_error('محصول پیدا نشد', 404);
    }

    $productId = $prod['id'];

    // 1. Get Approved Reviews for Product
    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT id, author_name AS authorName, rating, title, comment, verified_purchase AS verifiedPurchase, created_at AS createdAt
            FROM reviews
            WHERE product_id = ? AND approved = 1
            ORDER BY created_at DESC
        ");
        $stmt->execute([$productId]);
        $rows = $stmt->fetchAll();

        $items = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'authorName' => $r['authorName'],
                'rating' => (int)$r['rating'],
                'title' => $r['title'],
                'comment' => $r['comment'],
                'verifiedPurchase' => (bool)$r['verifiedPurchase'],
                'createdAt' => $r['createdAt'],
            ];
        }, $rows);

        json_response([
            'reviews' => $items,
            'total' => count($items),
        ]);
    }

    // 2. Submit Review: POST
    if ($method === 'POST') {
        $user = optional_auth();
        $body = get_json_input();

        $rating = (int)($body['rating'] ?? 5);
        $title = trim($body['title'] ?? '') ?: null;
        $comment = trim($body['comment'] ?? '');
        $authorName = trim($body['authorName'] ?? '') ?: ($user['name'] ?? 'کاربر مهمان');

        if ($rating < 1 || $rating > 5) {
            json_error('امتیاز باید بین ۱ تا ۵ ستاره باشد', 400);
        }
        if (mb_strlen($comment) < 5) {
            json_error('متن نظر باید حداقل ۵ حرف باشد', 400);
        }

        // Check if verified buyer
        $verified = 0;
        $userId = null;
        if ($user) {
            $userId = $user['id'];
            $buyStmt = $pdo->prepare("
                SELECT COUNT(*) 
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED')
            ");
            $buyStmt->execute([$user['id'], $productId]);
            $verified = ((int)$buyStmt->fetchColumn() > 0) ? 1 : 0;
        }

        $reviewId = generate_uuid();
        
        // Stored with approved = 0 (Requires admin moderation)
        $ins = $pdo->prepare("
            INSERT INTO reviews (id, product_id, user_id, author_name, rating, title, comment, verified_purchase, approved)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        ");
        $ins->execute([
            $reviewId, $productId, $userId, $authorName,
            $rating, $title, $comment, $verified
        ]);

        json_response([
            'id' => $reviewId,
            'success' => true,
            'message' => 'نظر شما با موفقیت ثبت شد و پس از بازبینی منتشر خواهد شد',
            'verifiedPurchase' => (bool)$verified,
        ], 201);
    }

    json_error('متد مجاز نیست', 405);
}
