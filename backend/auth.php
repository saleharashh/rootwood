<?php
/**
 * Rootwood Group — Authentication Handlers (Phone-Only OTP)
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/otp.php';
require_once __DIR__ . '/response.php';

function format_auth_user_payload(array $user): array {
    $phone = normalize_iranian_phone($user['phone'] ?? null) ?? ($user['phone'] ?? null);
    $role = is_admin_phone($phone) ? 'ADMIN' : 'CUSTOMER';
    $email = (string)($user['email'] ?? '');
    $name = (string)($user['name'] ?? '');

    return [
        'id' => $user['id'],
        'email' => $email,
        'name' => $name,
        'phone' => $phone,
        'role' => $role,
        'profileComplete' => !is_placeholder_name($name),
    ];
}

/**
 * Find the user behind a phone number, creating an account on first login and
 * keeping the role/phone synchronized with the ADMIN_PHONES allowlist.
 *
 * @return array{0: array, 1: bool} [user, isNewUser]
 */
function find_or_create_phone_user(string $phone, ?string $requestedName = null): array {
    $pdo = get_db();
    $allowedRole = is_admin_phone($phone) ? 'ADMIN' : 'CUSTOMER';
    $fallbackEmail = $phone . '@craftedroot.local';
    $plus98Phone = '+98' . substr($phone, 1);

    // Find user by phone (09... or legacy +98...) or synthetic local email
    $stmt = $pdo->prepare("SELECT id, email, name, phone, role, token_version FROM users WHERE phone IN (?, ?) OR email = ? LIMIT 1");
    $stmt->execute([$phone, $plus98Phone, $fallbackEmail]);
    $user = $stmt->fetch();
    $isNewUser = false;

    if (!$user) {
        $isNewUser = true;
        $userId = generate_uuid();
        $name = trim((string)$requestedName);
        if (mb_strlen($name) < 2) {
            $name = $allowedRole === 'ADMIN' ? 'مدیر آتلیه' : ('کاربر ' . substr($phone, -4));
        }
        $dummyPassHash = password_hash('otp-user-' . bin2hex(random_bytes(8)), PASSWORD_BCRYPT);

        $ins = $pdo->prepare("INSERT INTO users (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)");
        $ins->execute([$userId, $fallbackEmail, $dummyPassHash, $name, $phone, $allowedRole]);

        $user = [
            'id' => $userId,
            'email' => $fallbackEmail,
            'name' => $name,
            'phone' => $phone,
            'role' => $allowedRole,
            'token_version' => 0,
        ];
    } else {
        // Keep DB phone and role synchronized with allowlist
        $dbPhone = normalize_iranian_phone($user['phone'] ?? null);
        if ($user['role'] !== $allowedRole || $dbPhone !== $phone) {
            $pdo->prepare("UPDATE users SET role = ?, phone = ? WHERE id = ?")
                ->execute([$allowedRole, $phone, $user['id']]);
        }
        $user['phone'] = $phone;
        $user['role'] = $allowedRole;
    }

    return [$user, $isNewUser];
}

/**
 * Issue a signed JWT for an authenticated phone and store it in an HttpOnly cookie.
 *
 * @param array $user
 * @param array $config
 */
function issue_auth_session(array $user, string $phone, array $config): string {
    $role = is_admin_phone($phone) ? 'ADMIN' : 'CUSTOMER';

    $token = jwt_encode([
        'sub' => $user['id'],
        'email' => $user['email'],
        'phone' => $phone,
        'role' => $role,
        'tokenVersion' => (int)($user['token_version'] ?? 0),
    ], $config['jwt']['secret'], $config['jwt']['expires_in']);

    setcookie('craftedroot_token', $token, [
        'expires' => time() + $config['jwt']['expires_in'],
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    return $token;
}

/**
 * Admin password login is temporarily available until the SMS/OTP panel is connected.
 * Failures are throttled per phone with a small file in the system temp directory.
 */
function admin_login_throttle_file(string $phone): string {
    $dir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'rootwood-auth';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    return $dir . DIRECTORY_SEPARATOR . 'admin-' . hash('sha256', $phone) . '.json';
}

function admin_login_is_locked(string $phone): bool {
    $file = admin_login_throttle_file($phone);
    if (!is_file($file)) {
        return false;
    }

    $data = json_decode((string)@file_get_contents($file), true);
    if (!is_array($data)) {
        return false;
    }

    return (int)($data['resetAt'] ?? 0) > time() && (int)($data['fails'] ?? 0) >= 5;
}

function admin_login_record_failure(string $phone): void {
    $file = admin_login_throttle_file($phone);
    $fh = @fopen($file, 'c+');
    if (!$fh) {
        return;
    }

    if (flock($fh, LOCK_EX)) {
        $data = json_decode((string)stream_get_contents($fh), true);
        if (!is_array($data) || (int)($data['resetAt'] ?? 0) <= time()) {
            $data = ['fails' => 0, 'resetAt' => time() + 600];
        }
        $data['fails'] = (int)($data['fails'] ?? 0) + 1;

        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, (string)json_encode($data));
        fflush($fh);
        flock($fh, LOCK_UN);
    }

    fclose($fh);
}

function admin_login_clear_failures(string $phone): void {
    @unlink(admin_login_throttle_file($phone));
}

function handle_auth(string $subpath, string $method): void {
    $config = require __DIR__ . '/config.php';
    $pdo = get_db();

    // 1. Disabled Password Register / Login / Change Password (Phone OTP Only)
    if (in_array($subpath, ['/register', '/login', '/change-password'], true) && $method === 'POST') {
        json_error('ورود و ثبت‌نام فقط از طریق شماره موبایل و کد تأیید پیامکی امکان‌پذیر است', 410);
    }

    // 2. Send OTP (Phone Only)
    if ($subpath === '/send-otp' && $method === 'POST') {
        $body = get_json_input();
        $phone = normalize_iranian_phone((string)($body['identifier'] ?? $body['phone'] ?? ''));
        if ($phone === null) {
            json_error('لطفاً شماره موبایل معتبر ایرانی (مانند 09123456789) وارد نمایید', 400);
        }

        $issued = issue_otp($phone);
        $sendRes = send_otp_sms($phone, $issued['code']);
        if (!$sendRes['success'] && empty($sendRes['simulated'])) {
            revoke_otp($phone);
            json_error($sendRes['error'] ?? 'خطا در ارسال پیامک تأیید', 400);
        }

        $isSimulated = !empty($sendRes['simulated']);
        $isProduction = ($config['env'] === 'production');

        if ($isProduction && $isSimulated) {
            revoke_otp($phone);
            json_error('سامانه ارسال پیامک پیکربندی نشده است', 500);
        }

        $shouldReturnCode = (!$isProduction && $isSimulated);

        json_response([
            'success' => true,
            'message' => 'کد تأیید به شماره موبایل شما ارسال شد',
            'code' => $shouldReturnCode ? $issued['code'] : null,
            'expiresInSeconds' => $issued['expiresInSeconds'],
        ]);
    }

    // 3. Verify OTP (Phone Only)
    if ($subpath === '/verify-otp' && $method === 'POST') {
        $body = get_json_input();
        $phone = normalize_iranian_phone((string)($body['identifier'] ?? $body['phone'] ?? ''));
        $code = normalize_digits(trim((string)($body['code'] ?? '')));

        if ($phone === null || strlen($code) < 4) {
            json_error('شماره موبایل یا کد تأیید واردشده نامعتبر است', 400);
        }

        if (!verify_otp($phone, $code)) {
            json_error('کد تأیید واردشده نادرست یا منقضی شده است', 400);
        }

        $requestedName = trim((string)($body['name'] ?? ''));
        [$user, $isNewUser] = find_or_create_phone_user($phone, $requestedName !== '' ? $requestedName : null);

        $token = issue_auth_session($user, $phone, $config);

        $formattedUser = format_auth_user_payload($user);

        json_response([
            'accessToken' => $token,
            'user' => $formattedUser,
            'isNewUser' => $isNewUser,
            'profileComplete' => $formattedUser['profileComplete'],
        ]);
    }

    // 3.1 Temporary Admin Password Login (until the SMS/OTP panel is connected)
    if ($subpath === '/admin-login' && $method === 'POST') {
        $body = get_json_input();
        $phone = normalize_iranian_phone((string)($body['identifier'] ?? $body['phone'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($phone === null) {
            json_error('شماره موبایل واردشده معتبر نیست', 400);
        }

        $plainPassword = (string)($config['auth']['admin_password'] ?? '');
        $passwordHash = (string)($config['auth']['admin_password_hash'] ?? '');

        // Generic error for non-admin numbers so the allowlist is not enumerable.
        if (!is_admin_phone($phone) || ($plainPassword === '' && $passwordHash === '')) {
            json_error('شماره موبایل یا رمز عبور مدیر نادرست است', 401);
        }

        if ($password === '') {
            json_error('رمز عبور مدیر را وارد نمایید', 400);
        }

        if (admin_login_is_locked($phone)) {
            json_error('تعداد تلاش‌های ناموفق بیش از حد مجاز است؛ لطفاً ۱۰ دقیقه دیگر دوباره امتحان کنید', 429);
        }

        $valid = false;
        if ($passwordHash !== '') {
            $valid = password_verify($password, $passwordHash);
        }
        if (!$valid && $plainPassword !== '') {
            $valid = hash_equals($plainPassword, $password);
        }

        if (!$valid) {
            admin_login_record_failure($phone);
            json_error('شماره موبایل یا رمز عبور مدیر نادرست است', 401);
        }

        admin_login_clear_failures($phone);

        [$user, $isNewUser] = find_or_create_phone_user($phone);
        $token = issue_auth_session($user, $phone, $config);
        $formattedUser = format_auth_user_payload($user);

        json_response([
            'accessToken' => $token,
            'user' => $formattedUser,
            'isNewUser' => $isNewUser,
            'profileComplete' => $formattedUser['profileComplete'],
        ]);
    }

    // 4. Update Authenticated User Profile: PATCH /profile or PATCH /me
    if (($subpath === '/profile' || $subpath === '/me') && ($method === 'PATCH' || $method === 'PUT')) {
        $authUser = require_auth();
        $body = get_json_input();

        $name = trim((string)($body['name'] ?? ''));
        if (mb_strlen($name) < 2 || is_placeholder_name($name)) {
            json_error('لطفاً نام و نام خانوادگی واقعی خود را وارد نمایید (حداقل ۲ حرف)', 400);
        }

        $newEmail = (string)$authUser['email'];
        if (array_key_exists('email', $body)) {
            $rawEmail = strtolower(trim((string)($body['email'] ?? '')));
            if ($rawEmail === '') {
                $phone = normalize_iranian_phone($authUser['phone'] ?? null) ?? $authUser['id'];
                $newEmail = $phone . '@craftedroot.local';
            } else {
                if (!filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
                    json_error('فرمت ایمیل واردشده معتبر نیست', 400);
                }
                $dupStmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1");
                $dupStmt->execute([$rawEmail, $authUser['id']]);
                if ($dupStmt->fetch()) {
                    json_error('این ایمیل قبلاً برای حساب دیگری ثبت شده است', 409);
                }
                $newEmail = $rawEmail;
            }
        }

        $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?")
            ->execute([$name, $newEmail, $authUser['id']]);

        $authUser['name'] = $name;
        $authUser['email'] = $newEmail;
        $formattedUser = format_auth_user_payload($authUser);

        json_response([
            'success' => true,
            'message' => 'اطلاعات کاربری با موفقیت ثبت شد',
            'user' => $formattedUser,
        ]);
    }

    // 5. Logout
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

    // 6. Me
    if ($subpath === '/me' && $method === 'GET') {
        $user = require_auth();
        json_response(format_auth_user_payload($user));
    }

    json_error('مسیر احراز هویت پیدا نشد', 404);
}
