<?php
/**
 * Rootwood Group — Dynamic XML sitemap
 *
 * Served at /sitemap.xml (rewritten from the web root) or /api/sitemap.php.
 * Only indexable public URLs belong here: private routes and filtered
 * catalog URLs are intentionally excluded (they are noindex in the app).
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('X-Content-Type-Options: nosniff');

$base = rtrim(getenv('SITE_URL') ?: 'https://rootwoodgroup.ir', '/');

function sitemap_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function sitemap_lastmod(?string $value): ?string
{
    if (!$value) {
        return null;
    }
    $ts = strtotime($value);
    return $ts ? date('c', $ts) : null;
}

function sitemap_url(string $loc, ?string $lastmod = null, string $changefreq = 'monthly', float $priority = 0.5, ?string $image = null): string
{
    $xml = "  <url>\n";
    $xml .= '    <loc>' . sitemap_escape($loc) . "</loc>\n";
    if ($lastmod) {
        $xml .= '    <lastmod>' . sitemap_escape($lastmod) . "</lastmod>\n";
    }
    $xml .= '    <changefreq>' . $changefreq . "</changefreq>\n";
    $xml .= '    <priority>' . number_format($priority, 1, '.', '') . "</priority>\n";
    if ($image) {
        $xml .= "    <image:image>\n";
        $xml .= '      <image:loc>' . sitemap_escape($image) . "</image:loc>\n";
        $xml .= "    </image:image>\n";
    }
    $xml .= "  </url>\n";
    return $xml;
}

try {
    $pdo = get_db();

    $products = $pdo->query("\n        SELECT p.slug, p.updated_at, p.created_at,\n               (SELECT pi.url FROM product_images pi\n                 WHERE pi.product_id = p.id\n                 ORDER BY pi.sort_order ASC LIMIT 1) AS image\n        FROM products p\n        WHERE p.is_active = 1\n        ORDER BY p.created_at DESC\n    ")->fetchAll();

    $posts = $pdo->query("\n        SELECT slug, created_at, cover_image\n        FROM posts\n        WHERE published = 1\n        ORDER BY created_at DESC\n    ")->fetchAll();
} catch (Throwable $e) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "sitemap temporarily unavailable\n";
    error_log('sitemap: ' . $e->getMessage());
    exit;
}

$now = date('c');
$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

$xml .= sitemap_url($base . '/', $now, 'daily', 1.0, $base . '/images/logo-512.png');
$xml .= sitemap_url($base . '/products', $now, 'daily', 0.9);
$xml .= sitemap_url($base . '/blog', $now, 'weekly', 0.7);
$xml .= sitemap_url($base . '/about', null, 'monthly', 0.5);
$xml .= sitemap_url($base . '/contact', null, 'monthly', 0.5);

foreach ($products as $product) {
    if (empty($product['slug'])) {
        continue;
    }
    $image = $product['image'] ? (preg_match('#^https?://#i', $product['image']) ? $product['image'] : $base . '/' . ltrim($product['image'], '/')) : null;
    $xml .= sitemap_url(
        $base . '/products/' . rawurlencode($product['slug']),
        sitemap_lastmod($product['updated_at'] ?? $product['created_at']),
        'weekly',
        0.8,
        $image
    );
}

foreach ($posts as $post) {
    if (empty($post['slug'])) {
        continue;
    }
    $image = $post['cover_image'] ? (preg_match('#^https?://#i', $post['cover_image']) ? $post['cover_image'] : $base . '/' . ltrim($post['cover_image'], '/')) : null;
    $xml .= sitemap_url(
        $base . '/blog/' . rawurlencode($post['slug']),
        sitemap_lastmod($post['created_at']),
        'monthly',
        0.6,
        $image
    );
}

$xml .= '</urlset>' . "\n";
echo $xml;
