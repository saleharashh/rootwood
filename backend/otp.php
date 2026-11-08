<?php
/**
 * Rootwood Group — Secure OTP Service
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

function normalize_identifier(string $raw): array {
    $raw = trim($raw);
    if (filter_var($raw, FILTER_VALIDATE_EMAIL)) {
        return ['identifier' => strtolower($raw), 'isEmail' => true];
    }

    // Convert Persian & Arabic numbers to Latin digits
    $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    $arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    $digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    $cleaned = str_replace($persian, $digits, $raw);
    $cleaned = str_replace($arabic, $digits, $cleaned);
    $cleaned = preg_replace('/[^\d+]/', '', $cleaned);

    if (str_starts_with($cleaned, '+98')) {
        $cleaned = '0' . substr($cleaned, 3);
    } elseif (str_starts_with($cleaned, '0098')) {
        $cleaned = '0' . substr($cleaned, 4);
    }

    if (preg_match('/^09\d{9}$/', $cleaned)) {
        return ['identifier' => $cleaned, 'isEmail' => false];
    }

    return ['identifier' => null, 'isEmail' => false];
}

function otp_hash(string $identifier, string $code, string $secret): string {
    return hash_hmac('sha256', "$identifier:$code", $secret);
}

function issue_otp(string $identifier): array {
    $config = require __DIR__ . '/config.php';
    $otpCfg = $config['otp'];
    $pdo = get_db();

    // 1. Rate limiting: max sends within window
    $windowStart = date('Y-m-d H:i:s', time() - $otpCfg['max_sends_window']);
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM otp_codes WHERE identifier = ? AND created_at >= ?");
    $stmt->execute([$identifier, $windowStart]);
    $recentSends = (int)$stmt->fetchColumn();

    if ($recentSends >= $otpCfg['max_sends_count']) {
        json_error('تعداد درخواست کد تأیید بیش از حد مجاز است؛ لطفاً ۱۰ دقیقه دیگر تلاش کنید', 429);
    }

    // 2. Cryptographically secure 6-digit code
    $code = (string)random_int(100000, 999999);
    $codeHash = otp_hash($identifier, $code, $otpCfg['secret']);
    $now = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', time() + $otpCfg['ttl_seconds']);

    // 3. Invalidate previous active codes and insert new
    $pdo->beginTransaction();
    try {
        $revoke = $pdo->prepare("UPDATE otp_codes SET consumed_at = ? WHERE identifier = ? AND consumed_at IS NULL");
        $revoke->execute([$now, $identifier]);

        $ins = $pdo->prepare("INSERT INTO otp_codes (id, identifier, code_hash, attempts, expires_at) VALUES (?, ?, ?, 0, ?)");
        $ins->execute([generate_uuid(), $identifier, $codeHash, $expiresAt]);

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        json_error('خطا در صدور کد تأیید', 500);
    }

    return [
        'code' => $code,
        'expiresInSeconds' => $otpCfg['ttl_seconds'],
    ];
}

function verify_otp(string $identifier, string $code): bool {
    $config = require __DIR__ . '/config.php';
    $otpCfg = $config['otp'];
    $pdo = get_db();

    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("SELECT id, code_hash, attempts FROM otp_codes WHERE identifier = ? AND consumed_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$identifier, $now]);
    $row = $stmt->fetch();

    if (!$row) {
        return false;
    }

    // Burn if max attempts already reached
    if ((int)$row['attempts'] >= $otpCfg['max_attempts']) {
        $pdo->prepare("UPDATE otp_codes SET consumed_at = ? WHERE id = ?")->execute([$now, $row['id']]);
        return false;
    }

    $expectedHash = $row['code_hash'];
    $candidateHash = otp_hash($identifier, $code, $otpCfg['secret']);

    if (!hash_equals($expectedHash, $candidateHash)) {
        $newAttempts = (int)$row['attempts'] + 1;
        $burn = ($newAttempts >= $otpCfg['max_attempts']) ? $now : null;
        $up = $pdo->prepare("UPDATE otp_codes SET attempts = ?, consumed_at = ? WHERE id = ?");
        $up->execute([$newAttempts, $burn, $row['id']]);
        return false;
    }

    // Success: burn code
    $pdo->prepare("UPDATE otp_codes SET consumed_at = ? WHERE id = ?")->execute([$now, $row['id']]);
    return true;
}

function revoke_otp(string $identifier): void {
    $pdo = get_db();
    $now = date('Y-m-d H:i:s');
    $pdo->prepare("UPDATE otp_codes SET consumed_at = ? WHERE identifier = ? AND consumed_at IS NULL")->execute([$now, $identifier]);
}

function send_otp_sms(string $phone, string $code): array {
    $config = require __DIR__ . '/config.php';
    $apiKey = $config['sms']['kavenegar_api_key'];

    if (empty($apiKey) || $apiKey === 'YOUR_KAVENEGAR_API_KEY') {
        // Simulated in development
        return ['success' => true, 'simulated' => true];
    }

    // Real Kavenegar lookup call
    $url = "https://api.kavenegar.com/v1/$apiKey/verify/lookup.json";
    $params = [
        'receptor' => $phone,
        'token' => $code,
        'template' => 'craftedroot-verify',
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($status === 200) ? ['success' => true] : ['success' => false, 'error' => 'خطا در ارسال پیامک'];
}

function send_otp_email(string $email, string $code): array {
    $config = require __DIR__ . '/config.php';
    $apiKey = $config['mail']['resend_api_key'];

    if (empty($apiKey)) {
        return ['success' => true, 'simulated' => true];
    }

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiKey",
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'from' => $config['mail']['mail_from'],
        'to' => [$email],
        'subject' => 'کد ورود Rootwood Group',
        'text' => "کد ورود شما به روت‌وود گروپ: $code\nاین کد تا ۲ دقیقه دیگر منقضی می‌شود.",
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $res = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($status >= 200 && $status < 300) ? ['success' => true] : ['success' => false, 'error' => 'خطا در ارسال ایمیل'];
}
