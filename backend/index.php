<?php
/**
 * Rootwood Group — API Entry Point & Router
 */

declare(strict_types=1);

if (php_sapi_name() === 'cli-server') {
    $filePath = __DIR__ . parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (is_file($filePath)) {
        return false;
    }
}

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/db.php';

// Handle CORS headers and OPTIONS preflights
handle_cors();

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Strip script name or '/api' prefix
$scriptName = dirname($_SERVER['SCRIPT_NAME'] ?? '');
if ($scriptName !== '/' && $scriptName !== '\\' && str_starts_with($uri, $scriptName)) {
    $uri = substr($uri, strlen($scriptName));
}

$path = '/' . ltrim(preg_replace('#^/api/#', '/', $uri), '/');

// 1. Health check
if ($path === '/health' || $path === '') {
    $dbOk = false;
    try {
        $pdo = get_db();
        $pdo->query("SELECT 1");
        $dbOk = true;
    } catch (Exception $e) {
        $dbOk = false;
    }

    json_response([
        'status' => $dbOk ? 'ok' : 'degraded',
        'checks' => [
            'database' => $dbOk ? 'up' : 'down',
            'runtime' => 'PHP ' . PHP_VERSION,
        ],
        'timestamp' => date('c'),
    ]);
}

// 2. Auth routes: /auth/*
if (str_starts_with($path, '/auth')) {
    require_once __DIR__ . '/auth.php';
    handle_auth(substr($path, 5), $method);
}

// 3. Product Reviews: /catalog/products/{slug}/reviews or /products/{slug}/reviews
if (preg_match('#^/(?:catalog/)?products/([a-zA-Z0-9_\-]+)/reviews$#', $path, $matches)) {
    require_once __DIR__ . '/reviews.php';
    handle_reviews($matches[1], $method);
}

// 4. Catalog routes: /catalog/*, /products*, /categories*, /facets*
if (str_starts_with($path, '/catalog')) {
    require_once __DIR__ . '/catalog.php';
    handle_catalog(substr($path, 8), $method);
}
if (str_starts_with($path, '/products')) {
    require_once __DIR__ . '/catalog.php';
    handle_catalog('/products' . substr($path, 9), $method);
}
if (str_starts_with($path, '/categories')) {
    require_once __DIR__ . '/catalog.php';
    handle_catalog('/categories' . substr($path, 11), $method);
}
if (str_starts_with($path, '/facets')) {
    require_once __DIR__ . '/catalog.php';
    handle_catalog('/facets' . substr($path, 7), $method);
}

// 5. Cart routes: /cart*
if (str_starts_with($path, '/cart')) {
    require_once __DIR__ . '/cart.php';
    handle_cart(substr($path, 5), $method);
}

// 6. Orders routes: /orders*
if (str_starts_with($path, '/orders')) {
    require_once __DIR__ . '/orders.php';
    handle_orders(substr($path, 7), $method);
}

// 7. Payment routes: /payment/*
if (str_starts_with($path, '/payment')) {
    require_once __DIR__ . '/payment.php';
    handle_payment(substr($path, 8), $method);
}

// 8. Admin routes: /admin/*
if (str_starts_with($path, '/admin')) {
    require_once __DIR__ . '/admin.php';
    handle_admin(substr($path, 6), $method);
}

// 9. Blog routes: /blog/*
if (str_starts_with($path, '/blog')) {
    require_once __DIR__ . '/blog.php';
    handle_blog(substr($path, 5), $method);
}

// 10. Contact routes: /contact*
if (str_starts_with($path, '/contact')) {
    require_once __DIR__ . '/contact.php';
    handle_contact(substr($path, 8), $method);
}

// 11. Addresses routes: /addresses*
if (str_starts_with($path, '/addresses')) {
    require_once __DIR__ . '/addresses.php';
    handle_addresses(substr($path, 10), $method);
}

json_error('مسیر درخواستی یافت نشد', 404);
