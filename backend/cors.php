<?php
/**
 * Rootwood Group — CORS & Security Headers
 */

declare(strict_types=1);

function handle_cors(): void {
    $config = require __DIR__ . '/config.php';
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = $config['cors_origins'];

    if ($origin && in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    } elseif (!empty($allowedOrigins)) {
        // Fallback for non-browser or first matching origin in dev
        header("Access-Control-Allow-Origin: " . $allowedOrigins[0]);
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Cart-Session, Accept');
    header('Access-Control-Expose-Headers: Set-Cookie');

    // Security Hardening Headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
