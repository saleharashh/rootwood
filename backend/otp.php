<?php
/**
 * Rootwood Group — Secure OTP Service
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/response.php';

function normalize_identifier(string $raw): array {
    $phone = normalize_iranian_phone($raw);
    if ($phone !== null) {
        return ['identifier' => $phone, 'isEmail' => false];
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
    $smsCfg = $config['sms'];
    $apiKey = trim((string)$smsCfg['ir_api_key']);

    if ($apiKey === '') {
        // No provider configured (development): the code is returned by the API in dev mode.
        return ['success' => true, 'simulated' => true];
    }

    $templateId = (int)$smsCfg['ir_template_id'];
    if ($templateId <= 0) {
        return ['success' => false, 'error' => 'شناسهٔ قالب پیامک SMS.ir تنظیم نشده است'];
    }

    // SMS.ir — send a pre-approved verification template.
    $payload = [
        'mobile' => $phone,
        'templateId' => $templateId,
        'parameters' => [
            ['name' => (string)$smsCfg['ir_otp_parameter'], 'value' => $code],
        ],
    ];

    $ch = curl_init('https://api.sms.ir/v1/send/verify');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            'x-api-key: ' . $apiKey,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $raw = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpStatus = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false || $curlError !== '') {
        return ['success' => false, 'error' => 'خطا در ارتباط با سامانهٔ پیامک SMS.ir'];
    }

    $data = json_decode((string)$raw, true);
    if ($httpStatus >= 200 && $httpStatus < 300 && is_array($data) && (int)($data['status'] ?? 0) === 1) {
        return ['success' => true, 'messageId' => $data['data']['messageId'] ?? null];
    }

    $message = is_array($data) && !empty($data['message']) ? (string)$data['message'] : 'خطا در ارسال پیامک';
    return ['success' => false, 'error' => $message];
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
