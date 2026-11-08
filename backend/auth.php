<?php
/**
 * Rootwood Group — Authentication Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/otp.php';
require_once __DIR__ . '/response.php';

function handle_auth(string $subpath, string $method): void {
    $config = require __DIR__ . '/config.php';
    $pdo = get_db();

    // 1. Register
    if ($subpath === '/register' && $method === 'POST') {
        $body = get_json_input();
        $email = strtolower(trim($body['email'] ?? ''));
        $name = trim($body['name'] ?? '');
        $password = $body['password'] ?? '';
        $phone = trim($body['phone'] ?? '') ?: null;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('ایمیل واردشده معتبر نیست', 400);
        }
        if (mb_strlen($name) < 2) {
            json_error('نام باید حداقل ۲ حرف باشد', 400);
        }
        if (strlen($password) < 6) {
            json_error('رمز عبور باید حداقل ۶ کاراکتر باشد', 400);
        }

        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            json_error('این ایمیل قبلاً در سیستم ثبت شده است', 409);
        }

        $userId = generate_uuid();
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $ins = $pdo->prepare("INSERT INTO users (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, 'CUSTOMER')");
        $ins->execute([$userId, $email, $passwordHash, $name, $phone]);

        $token = jwt_encode([
            'sub' => $userId,
            'email' => $email,
            'role' => 'CUSTOMER',
            'tokenVersion' => 0,
        ], $config['jwt']['secret'], $config['jwt']['expires_in']);

        // Set HttpOnly cookie
        setcookie('craftedroot_token', $token, [
            'expires' => time() + $config['jwt']['expires_in'],
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        json_response([
            'accessToken' => $token,
            'user' => [
                'id' => $userId,
                'email' => $email,
                'name' => $name,
                'phone' => $phone,
                'role' => 'CUSTOMER',
            ]
        ], 201);
    }

    // 2. Login
    if ($subpath === '/login' && $method === 'POST') {
        $body = get_json_input();
        $email = strtolower(trim($body['email'] ?? ''));
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            json_error('ایمیل و رمز عبور الزامی هستند', 400);
        }

        $stmt = $pdo->prepare("SELECT id, email, password_hash, name, phone, role, token_version FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_error('ایمیل یا رمز عبور اشتباه است', 401);
        }

        $token = jwt_encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'tokenVersion' => (int)$user['token_version'],
        ], $config['jwt']['secret'], $config['jwt']['expires_in']);

        setcookie('craftedroot_token', $token, [
            'expires' => time() + $config['jwt']['expires_in'],
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        json_response([
            'accessToken' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'phone' => $user['phone'],
                'role' => $user['role'],
            ]
        ]);
    }

    // 3. Send OTP
    if ($subpath === '/send-otp' && $method === 'POST') {
        $body = get_json_input();
        $norm = normalize_identifier($body['identifier'] ?? '');
        if (!$norm['identifier']) {
            json_error('شماره موبایل یا ایمیل نامعتبر است', 400);
        }

        $issued = issue_otp($norm['identifier']);
        $isSimulated = false;

        if ($norm['isEmail']) {
            $sendRes = send_otp_email($norm['identifier'], $issued['code']);
            if (!$sendRes['success']) {
                revoke_otp($norm['identifier']);
                json_error($sendRes['error'] ?? 'خطا در ارسال ایمیل تأیید', 400);
            }
            $isSimulated = !empty($sendRes['simulated']);
        } else {
            $sendRes = send_otp_sms($norm['identifier'], $issued['code']);
            if (!$sendRes['success'] && empty($sendRes['simulated'])) {
                revoke_otp($norm['identifier']);
                json_error($sendRes['error'] ?? 'خطا در ارسال پیامک تأیید', 400);
            }
            $isSimulated = !empty($sendRes['simulated']);
        }

        $isProduction = ($config['env'] === 'production');
        if ($isProduction && $isSimulated) {
            revoke_otp($norm['identifier']);
            json_error('سامانه ارسال پیامک/ایمیل پیکربندی نشده است', 500);
        }

        $shouldReturnCode = (!$isProduction && $isSimulated);

        json_response([
            'success' => true,
            'message' => sprintf('کد تأیید برای %s شما ارسال شد', $norm['isEmail'] ? 'ایمیل' : 'شماره'),
            'code' => $shouldReturnCode ? $issued['code'] : null,
            'expiresInSeconds' => $issued['expiresInSeconds'],
        ]);
    }

    // 4. Verify OTP
    if ($subpath === '/verify-otp' && $method === 'POST') {
        $body = get_json_input();
        $norm = normalize_identifier($body['identifier'] ?? '');
        $code = trim($body['code'] ?? '');

        if (!$norm['identifier'] || strlen($code) < 4) {
            json_error('اطلاعات واردشده نامعتبر است', 400);
        }

        if (!verify_otp($norm['identifier'], $code)) {
            json_error('کد تأیید واردشده نادرست یا منقضی شده است', 400);
        }

        // Find or create user
        $user = null;
        if ($norm['isEmail']) {
            $stmt = $pdo->prepare("SELECT id, email, name, phone, role, token_version FROM users WHERE email = ?");
            $stmt->execute([$norm['identifier']]);
            $user = $stmt->fetch();
        } else {
            $stmt = $pdo->prepare("SELECT id, email, name, phone, role, token_version FROM users WHERE phone = ? OR email = ?");
            $stmt->execute([$norm['identifier'], $norm['identifier'] . '@craftedroot.local']);
            $user = $stmt->fetch();
        }

        if (!$user) {
            $userId = generate_uuid();
            $generatedEmail = $norm['isEmail'] ? $norm['identifier'] : ($norm['identifier'] . '@craftedroot.local');
            $name = trim($body['name'] ?? '') ?: ($norm['isEmail'] ? explode('@', $norm['identifier'])[0] : ('کاربر ' . substr($norm['identifier'], -4)));
            $dummyPassHash = password_hash('otp-user-' . time(), PASSWORD_BCRYPT);

            $ins = $pdo->prepare("INSERT INTO users (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, 'CUSTOMER')");
            $ins->execute([$userId, $generatedEmail, $dummyPassHash, $name, $norm['isEmail'] ? null : $norm['identifier']]);

            $user = [
                'id' => $userId,
                'email' => $generatedEmail,
                'name' => $name,
                'phone' => $norm['isEmail'] ? null : $norm['identifier'],
                'role' => 'CUSTOMER',
                'token_version' => 0,
            ];
        }

        $token = jwt_encode([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'tokenVersion' => (int)$user['token_version'],
        ], $config['jwt']['secret'], $config['jwt']['expires_in']);

        setcookie('craftedroot_token', $token, [
            'expires' => time() + $config['jwt']['expires_in'],
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        json_response([
            'accessToken' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'phone' => $user['phone'],
                'role' => $user['role'],
            ]
        ]);
    }

    // 5. Change Password
    if ($subpath === '/change-password' && $method === 'POST') {
        $authUser = require_auth();
        $body = get_json_input();
        $curPass = $body['currentPassword'] ?? '';
        $newPass = $body['newPassword'] ?? '';

        if (strlen($newPass) < 6) {
            json_error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد', 400);
        }

        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$authUser['id']]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($curPass, $row['password_hash'])) {
            json_error('رمز عبور فعلی نادرست است', 401);
        }

        $newHash = password_hash($newPass, PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare("UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?")
            ->execute([$newHash, $authUser['id']]);

        // Issue new token with updated token_version
        $newToken = jwt_encode([
            'sub' => $authUser['id'],
            'email' => $authUser['email'],
            'role' => $authUser['role'],
            'tokenVersion' => (int)$authUser['token_version'] + 1,
        ], $config['jwt']['secret'], $config['jwt']['expires_in']);

        json_response([
            'success' => true,
            'accessToken' => $newToken,
            'message' => 'رمز عبور با موفقیت به‌روزرسانی شد',
        ]);
    }

    // 6. Logout
    if ($subpath === '/logout' && $method === 'POST') {
        $user = get_auth_user();
        if ($user) {
            $pdo->prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?")
                ->execute([$user['id']]);
        }
        setcookie('craftedroot_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        json_response(['success' => true]);
    }

    // 7. Me
    if ($subpath === '/me' && $method === 'GET') {
        $user = require_auth();
        json_response([
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'phone' => $user['phone'],
            'role' => $user['role'],
        ]);
    }

    json_error('مسیر احراز هویت پیدا نشد', 404);
}
