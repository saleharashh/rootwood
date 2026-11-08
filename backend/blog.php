<?php
/**
 * Rootwood Group — Blog Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/response.php';

function handle_blog(string $subpath, string $method): void {
    $pdo = get_db();

    // 1. Tags List: GET /tags
    if ($subpath === '/tags' && $method === 'GET') {
        $stmt = $pdo->query("SELECT tags FROM posts WHERE published = 1");
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $tagCounts = [];
        foreach ($rows as $tagsJson) {
            $tags = json_decode($tagsJson, true);
            if (is_array($tags)) {
                foreach ($tags as $t) {
                    $t = trim($t);
                    if ($t !== '') {
                        $tagCounts[$t] = ($tagCounts[$t] ?? 0) + 1;
                    }
                }
            }
        }
        json_response(array_keys($tagCounts));
    }

    // 2. Posts List: GET /posts or /blog
    if (($subpath === '/posts' || $subpath === '' || $subpath === '/') && $method === 'GET') {
        $tag = trim($_GET['tag'] ?? '');
        $q = trim($_GET['q'] ?? '');
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        $where = ['p.published = 1'];
        $params = [];

        if ($q !== '') {
            $where[] = '(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)';
            $term = "%$q%";
            $params[] = $term; $params[] = $term; $params[] = $term;
        }

        if ($tag !== '') {
            $where[] = "JSON_CONTAINS(p.tags, ?)";
            $params[] = json_encode($tag, JSON_UNESCAPED_UNICODE);
        }

        $whereSql = implode(' AND ', $where);

        $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM posts p WHERE $whereSql");
        $cntStmt->execute($params);
        $total = (int)$cntStmt->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT p.*, u.name AS author_name
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE $whereSql
            ORDER BY p.created_at DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $items = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'slug' => $r['slug'],
                'title' => $r['title'],
                'excerpt' => $r['excerpt'],
                'content' => $r['content'],
                'coverImage' => $r['cover_image'],
                'author' => ['name' => $r['author_name']],
                'tags' => json_decode($r['tags'], true) ?: [],
                'createdAt' => $r['created_at'],
            ];
        }, $rows);

        json_response([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'hasMore' => ($offset + count($items)) < $total,
        ]);
    }

    // 3. Single Post by Slug: GET /posts/{slug} or /{slug}
    if (preg_match('#^/(?:posts/)?([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'GET') {
        $slug = $matches[1];
        $stmt = $pdo->prepare("
            SELECT p.*, u.name AS author_name
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.slug = ? AND p.published = 1
        ");
        $stmt->execute([$slug]);
        $r = $stmt->fetch();

        if (!$r) {
            json_error('مقاله پیدا نشد', 404);
        }

        json_response([
            'id' => $r['id'],
            'slug' => $r['slug'],
            'title' => $r['title'],
            'excerpt' => $r['excerpt'],
            'content' => $r['content'],
            'coverImage' => $r['cover_image'],
            'author' => ['name' => $r['author_name']],
            'tags' => json_decode($r['tags'], true) ?: [],
            'createdAt' => $r['created_at'],
        ]);
    }

    json_error('مسیر مجله پیدا نشد', 404);
}
