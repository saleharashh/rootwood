<?php
/**
 * Rootwood Group — Configuration
 */

declare(strict_types=1);

// Basic .env parser if file exists
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (strpos($line, '=') !== false) {
            [$key, $val] = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                $val = substr($val, 1, -1);
            }
            if (!isset($_ENV[$key])) {
                $_ENV[$key] = $val;
                putenv("$key=$val");
            }
        }
    }
}

function env(string $key, ?string $default = null): ?string {
    $val = $_ENV[$key] ?? getenv($key);
    return ($val !== false && $val !== null && $val !== '') ? $val : $default;
}

return [
    'env' => env('APP_ENV', 'development'),
    'site_url' => rtrim(env('SITE_URL', 'http://localhost:5173'), '/'),
    'api_url' => rtrim(env('API_URL', 'http://localhost:8000/api'), '/'),
    
    // Database
    'db' => [
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => (int)env('DB_PORT', '3306'),
        'name' => env('DB_NAME', 'rootwood'),
        'user' => env('DB_USER', 'root'),
        'pass' => env('DB_PASS', 'root'),
        'charset' => 'utf8mb4',
    ],
    
    // Security & Auth
    'jwt' => [
        'secret' => env('JWT_SECRET', 'craftedroot-secure-jwt-secret-minimum-32-chars-long!'),
        'expires_in' => (int)env('JWT_EXPIRES_IN', '86400'), // 24 hours
    ],
    'otp' => [
        'secret' => env('OTP_SECRET', env('JWT_SECRET', 'craftedroot-otp-secret-key-32-bytes!')),
        'ttl_seconds' => 120,
        'max_attempts' => 5,
        'max_sends_window' => 600, // 10 minutes
        'max_sends_count' => 5,
    ],
    
    // Gateways
    'payment' => [
        'simulation' => env('PAYMENT_SIMULATION', 'true') === 'true',
        'zarinpal_merchant' => env('ZARINPAL_MERCHANT_ID', ''),
        'zarinpal_sandbox' => env('ZARINPAL_SANDBOX', 'true') === 'true',
        'zibal_merchant' => env('ZIBAL_MERCHANT', ''),
        'zibal_sandbox' => env('ZIBAL_SANDBOX', 'true') === 'true',
    ],
    
    // SMS / Email (Kavenegar / Resend)
    'sms' => [
        'kavenegar_api_key' => env('KAVENEGAR_API_KEY', ''),
        'kavenegar_sender' => env('KAVENEGAR_SENDER', ''),
    ],
    'mail' => [
        'resend_api_key' => env('RESEND_API_KEY', ''),
        'mail_from' => env('MAIL_FROM', 'orders@rootwoodgroup.ir'),
    ],
    
    // CORS Allowed Origins
    'cors_origins' => array_filter(array_map('trim', explode(',', env('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')))),
];
