<?php
/**
 * Rootwood Group — JWT Utilities (HMAC-SHA256)
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function base64_url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64_url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode(array $payload, string $secret, int $expiresInSeconds): string {
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiresInSeconds;

    $b64Header = base64_url_encode((string)json_encode($header));
    $b64Payload = base64_url_encode((string)json_encode($payload));

    $signature = hash_hmac('sha256', "$b64Header.$b64Payload", $secret, true);
    $b64Signature = base64_url_encode($signature);

    return "$b64Header.$b64Payload.$b64Signature";
}

function jwt_decode(string $jwt, string $secret): ?array {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    [$b64Header, $b64Payload, $b64Signature] = $parts;

    $expectedSignature = hash_hmac('sha256', "$b64Header.$b64Payload", $secret, true);
    $candidateSignature = base64_url_decode($b64Signature);

    if (!hash_equals($expectedSignature, $candidateSignature)) {
        return null;
    }

    $payload = json_decode(base64_url_decode($b64Payload), true);
    if (!is_array($payload)) {
        return null;
    }

    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return null; // Expired
    }

    return $payload;
}

function get_bearer_token(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
        return $matches[1];
    }
    // Also check HttpOnly cookie fallback
    if (isset($_COOKIE['craftedroot_token'])) {
        return $_COOKIE['craftedroot_token'];
    }
    return null;
}

function get_auth_user(): ?array {
    static $currentUser = false;
    if ($currentUser !== false) {
        return $currentUser;
    }

    $token = get_bearer_token();
    if (!$token) {
        $currentUser = null;
        return null;
    }

    $config = require __DIR__ . '/config.php';
    $payload = jwt_decode($token, $config['jwt']['secret']);
    if (!$payload || empty($payload['sub'])) {
        $currentUser = null;
        return null;
    }

    $pdo = get_db();
    $stmt = $pdo->prepare("SELECT id, email, name, phone, role, token_version FROM users WHERE id = ?");
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();

    if (!$user) {
        $currentUser = null;
        return null;
    }

    // Check token version to guarantee instant revocation on logout or password change
    if (isset($payload['tokenVersion']) && (int)$payload['tokenVersion'] !== (int)$user['token_version']) {
        $currentUser = null;
        return null;
    }

    $currentUser = $user;
    return $user;
}

function require_auth(): array {
    $user = get_auth_user();
    if (!$user) {
        json_error('برای دسترسی به این بخش لطفاً وارد حساب کاربری خود شوید', 401);
    }
    return $user;
}

function require_admin(): array {
    $user = require_auth();
    if ($user['role'] !== 'ADMIN') {
        json_error('دسترسی مجاز نیست. این بخش مخصوص مدیران است', 403);
    }
    return $user;
}
