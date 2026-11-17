<?php
/**
 * Rootwood Group — Catalog Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function format_product_row(array $row, PDO $pdo): array {
    // Get product images
    $imgStmt = $pdo->prepare("SELECT id, url, alt, sort_order AS sortOrder FROM product_images WHERE product_id = ? ORDER BY sort_order ASC");
    $imgStmt->execute([$row['id']]);
    $images = $imgStmt->fetchAll();

    // Get rating summary
    $ratStmt = $pdo->prepare("SELECT AVG(rating) AS avg_rat, COUNT(*) AS count_rat FROM reviews WHERE product_id = ? AND approved = 1");
    $ratStmt->execute([$row['id']]);
    $rat = $ratStmt->fetch();

    $avg = $rat && $rat['avg_rat'] ? round((float)$rat['avg_rat'], 1) : 0;
    $cnt = $rat ? (int)$rat['count_rat'] : 0;

    return [
        'id' => $row['id'],
        'slug' => $row['slug'],
        'name' => $row['name'],
        'tagline' => $row['tagline'],
        'description' => $row['description'],
        'price' => (int)$row['price'],
        'compareAt' => $row['compare_at'] !== null ? (int)$row['compare_at'] : null,
        'sku' => $row['sku'],
        'stock' => (int)$row['stock'],
        'woodType' => $row['wood_type'],
        'finish' => $row['finish'],
        'dimensions' => $row['dimensions'],
        'weightKg' => $row['weight_kg'] !== null ? (float)$row['weight_kg'] : null,
        'featured' => (bool)$row['featured'],
        'isActive' => (bool)$row['is_active'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'categoryId' => $row['category_id'],
        'category' => [
            'id' => $row['category_id'],
            'name' => $row['category_name'] ?? '',
            'slug' => $row['category_slug'] ?? '',
        ],
        'images' => $images,
        'rating' => [
            'average' => $avg,
            'count' => $cnt,
        ],
    ];
}

function handle_catalog(string $subpath, string $method): void {
    $pdo = get_db();

    // 1. Categories
    if ($subpath === '/categories' && $method === 'GET') {
        $stmt = $pdo->query("
            SELECT c.*, COUNT(p.id) AS productCount
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
            GROUP BY c.id
            ORDER BY c.sort_order ASC, c.name ASC
        ");
        $rows = $stmt->fetchAll();
        $res = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'slug' => $r['slug'],
                'name' => $r['name'],
                'description' => $r['description'],
                'imageUrl' => $r['image_url'],
                'sortOrder' => (int)$r['sort_order'],
                'productCount' => (int)$r['productCount'],
            ];
        }, $rows);
        json_response($res);
    }

    // 2. Facets
    if ($subpath === '/facets' && $method === 'GET') {
        $wStmt = $pdo->query("SELECT DISTINCT wood_type FROM products WHERE is_active = 1 AND wood_type IS NOT NULL ORDER BY wood_type ASC");
        $woods = $wStmt->fetchAll(PDO::FETCH_COLUMN);

        $pStmt = $pdo->query("SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM products WHERE is_active = 1");
        $prices = $pStmt->fetch();

        json_response([
            'woodTypes' => array_values(array_filter($woods)),
            'priceMin' => (int)($prices['min_price'] ?? 0),
            'priceMax' => (int)($prices['max_price'] ?? 0),
        ]);
    }

    // 3. Products List
    if ($subpath === '/products' && $method === 'GET') {
        $search = trim($_GET['search'] ?? '');
        $category = trim($_GET['category'] ?? '');
        $woodType = trim($_GET['woodType'] ?? '');
        $featured = isset($_GET['featured']) ? ($_GET['featured'] === 'true' || $_GET['featured'] === '1') : null;
        $minPrice = isset($_GET['minPrice']) ? (int)$_GET['minPrice'] : null;
        $maxPrice = isset($_GET['maxPrice']) ? (int)$_GET['maxPrice'] : null;
        $sort = $_GET['sort'] ?? 'newest';
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 24)));
        $offset = max(0, (int)($_GET['offset'] ?? 0));

        $includeInactive = isset($_GET['includeInactive'])
            && ($_GET['includeInactive'] === '1' || $_GET['includeInactive'] === 'true');

        if ($includeInactive) {
            $authUser = get_auth_user();
            if (!$authUser || $authUser['role'] !== 'ADMIN') {
                $includeInactive = false;
            }
        }

        $where = $includeInactive ? ['1=1'] : ['p.is_active = 1'];
        $params = [];

        if ($search !== '') {
            $where[] = "(p.name LIKE ? OR p.tagline LIKE ? OR p.description LIKE ? OR p.wood_type LIKE ?)";
            $term = "%$search%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        if ($category !== '') {
            $where[] = "c.slug = ?";
            $params[] = $category;
        }

        if ($woodType !== '') {
            $where[] = "p.wood_type = ?";
            $params[] = $woodType;
        }

        if ($featured !== null) {
            $where[] = "p.featured = ?";
            $params[] = $featured ? 1 : 0;
        }

        if ($minPrice !== null) {
            $where[] = "p.price >= ?";
            $params[] = $minPrice;
        }

        if ($maxPrice !== null) {
            $where[] = "p.price <= ?";
            $params[] = $maxPrice;
        }

        $whereSql = implode(' AND ', $where);

        // Sorting
        $orderBy = 'p.created_at DESC';
        if ($sort === 'price-asc') {
            $orderBy = 'p.price ASC';
        } elseif ($sort === 'price-desc') {
            $orderBy = 'p.price DESC';
        } elseif ($sort === 'name') {
            $orderBy = 'p.name ASC';
        }

        // Count
        $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE $whereSql");
        $cntStmt->execute($params);
        $total = (int)$cntStmt->fetchColumn();

        // Items query
        $sql = "
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE $whereSql
            ORDER BY $orderBy
            LIMIT $limit OFFSET $offset
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $items = [];
        foreach ($rows as $r) {
            $items[] = format_product_row($r, $pdo);
        }

        json_response([
            'items' => $items,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'hasMore' => ($offset + count($items)) < $total,
        ]);
    }

    // 4. Product Details by Slug: /products/{slug}
    if (preg_match('#^/products/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'GET') {
        $slug = $matches[1];
        $stmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.is_active = 1
        ");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();

        if (!$row) {
            json_error('محصول مورد نظر پیدا نشد', 404);
        }

        json_response(format_product_row($row, $pdo));
    }

    // 5. Related Products: /products/{slug}/related
    if (preg_match('#^/products/([a-zA-Z0-9_\-]+)/related$#', $subpath, $matches) && $method === 'GET') {
        $slug = $matches[1];
        $stmt = $pdo->prepare("SELECT category_id, id FROM products WHERE slug = ?");
        $stmt->execute([$slug]);
        $curr = $stmt->fetch();

        if (!$curr) {
            json_response([]);
        }

        $relStmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
            ORDER BY p.featured DESC, p.created_at DESC
            LIMIT 4
        ");
        $relStmt->execute([$curr['category_id'], $curr['id']]);
        $rows = $relStmt->fetchAll();

        $items = [];
        foreach ($rows as $r) {
            $items[] = format_product_row($r, $pdo);
        }

        json_response($items);
    }

    // 6. Admin Create Product
    if ($subpath === '/products' && $method === 'POST') {
        require_admin();
        $body = get_json_input();

        $id = generate_uuid();
        $slug = trim($body['slug'] ?? '');
        $name = trim($body['name'] ?? '');
        $price = (int)($body['price'] ?? 0);
        $sku = trim($body['sku'] ?? '');
        $catId = trim($body['categoryId'] ?? '');
        $stock = (int)($body['stock'] ?? 0);

        if (!$slug || !$name || $price <= 0 || !$sku || !$catId) {
            json_error('اطلاعات ضروری محصول وارد نشده است', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO products (id, slug, name, tagline, description, price, compare_at, sku, stock, category_id, wood_type, finish, dimensions, weight_kg, featured, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id, $slug, $name, $body['tagline'] ?? null, $body['description'] ?? '',
            $price, $body['compareAt'] ?? null, $sku, $stock, $catId,
            $body['woodType'] ?? null, $body['finish'] ?? null, $body['dimensions'] ?? null,
            $body['weightKg'] ?? null, !empty($body['featured']) ? 1 : 0, !empty($body['isActive']) ? 1 : 0
        ]);

        if (!empty($body['images']) && is_array($body['images'])) {
            $imgStmt = $pdo->prepare("INSERT INTO product_images (id, product_id, url, alt, sort_order) VALUES (?, ?, ?, ?, ?)");
            foreach ($body['images'] as $idx => $imgUrl) {
                $imgStmt->execute([generate_uuid(), $id, $imgUrl, $name, $idx + 1]);
            }
        }

        $fStmt = $pdo->prepare("
            SELECT p.*, c.name AS category_name, c.slug AS category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        ");
        $fStmt->execute([$id]);
        $row = $fStmt->fetch();

        json_response([
            'id' => $id,
            'slug' => $slug,
            'product' => $row ? format_product_row($row, $pdo) : ['id' => $id, 'slug' => $slug],
            'success' => true
        ], 201);
    }

    // 7. Admin Update Product
    if (preg_match('#^/products/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'PATCH') {
        require_admin();
        $id = $matches[1];
        $body = get_json_input();

        $fields = [];
        $params = [];

        if (isset($body['name'])) { $fields[] = 'name = ?'; $params[] = trim($body['name']); }
        if (isset($body['price'])) { $fields[] = 'price = ?'; $params[] = (int)$body['price']; }
        if (isset($body['stock'])) { $fields[] = 'stock = ?'; $params[] = (int)$body['stock']; }
        if (isset($body['isActive'])) { $fields[] = 'is_active = ?'; $params[] = $body['isActive'] ? 1 : 0; }
        if (isset($body['featured'])) { $fields[] = 'featured = ?'; $params[] = $body['featured'] ? 1 : 0; }
        if (isset($body['description'])) { $fields[] = 'description = ?'; $params[] = $body['description']; }

        if (!empty($fields)) {
            $params[] = $id;
            $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = ?";
            $pdo->prepare($sql)->execute($params);
        }

        json_response(['id' => $id, 'success' => true]);
    }

    json_error('مسیر کاتالوگ پیدا نشد', 404);
}
