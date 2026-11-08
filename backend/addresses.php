<?php
/**
 * Rootwood Group — Addresses Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function handle_addresses(string $subpath, string $method): void {
    $user = require_auth();
    $pdo = get_db();

    // 1. List User Addresses: GET /
    if (($subpath === '' || $subpath === '/') && $method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();

        $res = array_map(function ($r) {
            return [
                'id' => $r['id'],
                'fullName' => $r['full_name'],
                'line1' => $r['line1'],
                'line2' => $r['line2'],
                'city' => $r['city'],
                'state' => $r['state'],
                'postalCode' => $r['postal_code'],
                'country' => $r['country'],
                'phone' => $r['phone'],
                'isDefault' => (bool)$r['is_default'],
            ];
        }, $rows);

        json_response($res);
    }

    // 2. Create Address: POST /
    if (($subpath === '' || $subpath === '/') && $method === 'POST') {
        $body = get_json_input();
        $fullName = trim($body['fullName'] ?? '');
        $line1 = trim($body['line1'] ?? '');
        $city = trim($body['city'] ?? '');
        $postalCode = trim($body['postalCode'] ?? '');
        $isDefault = !empty($body['isDefault']) ? 1 : 0;

        if (!$fullName || !$line1 || !$city || !$postalCode) {
            json_error('اطلاعات آدرس ناقص است', 400);
        }

        if ($isDefault) {
            $pdo->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?")->execute([$user['id']]);
        }

        $id = generate_uuid();
        $stmt = $pdo->prepare("
            INSERT INTO addresses (id, user_id, full_name, line1, line2, city, state, postal_code, country, phone, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IR', ?, ?)
        ");
        $stmt->execute([
            $id, $user['id'], $fullName, $line1, trim($body['line2'] ?? '') ?: null,
            $city, trim($body['state'] ?? '') ?: null, $postalCode,
            trim($body['phone'] ?? '') ?: $user['phone'], $isDefault
        ]);

        json_response(['id' => $id, 'success' => true], 201);
    }

    // 3. Delete Address: DELETE /{id}
    if (preg_match('#^/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'DELETE') {
        $addrId = $matches[1];
        $pdo->prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?")->execute([$addrId, $user['id']]);
        json_response(['success' => true]);
    }

    json_error('مسیر آدرس پیدا نشد', 404);
}
