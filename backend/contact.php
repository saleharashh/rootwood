<?php
/**
 * Rootwood Group — Contact Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function handle_contact(string $subpath, string $method): void {
    $pdo = get_db();

    if (($subpath === '' || $subpath === '/') && $method === 'POST') {
        $user = get_auth_user();
        $body = get_json_input();

        $name = trim($body['name'] ?? '');
        $email = strtolower(trim($body['email'] ?? ''));
        $phone = trim($body['phone'] ?? '') ?: null;
        $subject = trim($body['subject'] ?? 'پیام جدید از سایت');
        $message = trim($body['message'] ?? '');

        if (mb_strlen($name) < 2) {
            json_error('نام و نام خانوادگی الزامی است', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('ایمیل معتبر نیست', 400);
        }
        if (mb_strlen($message) < 5) {
            json_error('متن پیام باید حداقل ۵ حرف باشد', 400);
        }

        $id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO contact_messages (id, user_id, name, email, phone, subject, message, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW')
        ");
        $stmt->execute([$id, $user ? $user['id'] : null, $name, $email, $phone, $subject, $message]);

        json_response([
            'id' => $id,
            'success' => true,
            'message' => 'پیام شما با موفقیت ثبت شد. تیم کارگاه به زودی با شما تماس خواهد گرفت.',
        ], 201);
    }

    json_error('مسیر تماس پیدا نشد', 404);
}
