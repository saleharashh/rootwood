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

if (!function_exists('env')) {
    function env(string $key, ?string $default = null): ?string {
        if (array_key_exists($key, $_ENV)) {
            return (string)$_ENV[$key];
        }
        $val = getenv($key);
        if ($val !== false) {
            return (string)$val;
        }
        return $default;
    }
}

$dbHost = env('DB_HOST', env('MYSQLHOST', '127.0.0.1'));
$dbPort = (int)env('DB_PORT', env('MYSQLPORT', '3306'));
$dbName = env('DB_NAME', env('MYSQLDATABASE', 'rootwood'));
$dbUser = env('DB_USER', env('MYSQLUSER', 'root'));
$dbPass = env('DB_PASS', env('MYSQLPASSWORD', 'root'));

$mysqlUrl = env('MYSQL_URL');
if ($mysqlUrl) {
    $parsed = parse_url($mysqlUrl);
    if ($parsed) {
        if (!empty($parsed['host'])) $dbHost = $parsed['host'];
        if (!empty($parsed['port'])) $dbPort = (int)$parsed['port'];
        if (!empty($parsed['user'])) $dbUser = urldecode($parsed['user']);
        if (isset($parsed['pass'])) $dbPass = urldecode($parsed['pass']);
        if (!empty($parsed['path'])) $dbName = ltrim(urldecode($parsed['path']), '/');
    }
}

return [
    'env' => env('APP_ENV', 'development'),
    'site_url' => rtrim(env('SITE_URL', 'http://localhost:5173'), '/'),
    'api_url' => rtrim(env('API_URL', 'http://localhost:8000/api'), '/'),
    
    // Database
    'db' => [
        'host' => $dbHost,
        'port' => $dbPort,
        'name' => $dbName,
        'user' => $dbUser,
        'pass' => $dbPass,
        'charset' => 'utf8mb4',
    ],
    
    // Security & Auth
    'auth' => [
        // Comma-separated list; the role is re-synced from this list on every OTP login.
        'admin_phones' => array_values(array_filter(array_map(
            'trim',
            explode(',', env('ADMIN_PHONES', '09131534532,09134398431') ?? '')
        ))),
        // Temporary password login for the admin phones above (used until the SMS panel is connected).
        // Leave both empty to disable it and require OTP only.
        'admin_password' => (string)env('ADMIN_PASSWORD', ''),
        'admin_password_hash' => (string)env('ADMIN_PASSWORD_HASH', ''),
    ],
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
    
    // SMS / Email (SMS.ir / Resend)
    'sms' => [
        'ir_api_key' => env('SMS_IR_API_KEY', ''),
        'ir_template_id' => env('SMS_IR_TEMPLATE_ID', ''),
        'ir_otp_parameter' => env('SMS_IR_OTP_PARAMETER', 'CODE'),
    ],
    'mail' => [
        'resend_api_key' => env('RESEND_API_KEY', ''),
        'mail_from' => env('MAIL_FROM', 'orders@rootwoodgroup.ir'),
    ],
    
    // CORS Allowed Origins
    'cors_origins' => array_filter(array_map('trim', explode(',', env('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')))),
];
