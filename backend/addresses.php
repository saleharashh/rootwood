<?php
/**
 * Rootwood Group — Addresses Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function format_address_row(array $r): array {
    return [
        'id' => $r['id'],
        'fullName' => $r['full_name'],
        'recipientName' => $r['full_name'],
        'line1' => $r['line1'],
        'street' => $r['line1'],
        'line2' => $r['line2'],
        'city' => $r['city'],
        'state' => $r['state'],
        'province' => $r['state'],
        'postalCode' => $r['postal_code'],
        'country' => $r['country'],
        'phone' => $r['phone'],
        'isDefault' => (bool)$r['is_default'],
    ];
}

function handle_addresses(string $subpath, string $method): void {
    $user = require_auth();
    $pdo = get_db();

    // 1. List User Addresses: GET /
    if (($subpath === '' || $subpath === '/') && $method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC");
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();

        $res = array_map('format_address_row', $rows);
        json_response($res);
    }

    // 2. Create Address: POST /
    if (($subpath === '' || $subpath === '/') && $method === 'POST') {
        $body = get_json_input();
        $fullName = trim((string)($body['fullName'] ?? $body['recipientName'] ?? ''));
        $line1 = trim((string)($body['line1'] ?? $body['street'] ?? ''));
        $line2 = trim((string)($body['line2'] ?? '')) ?: null;
        $state = trim((string)($body['state'] ?? $body['province'] ?? ''));
        $city = trim((string)($body['city'] ?? ''));
        $postalCode = normalize_postal_code((string)($body['postalCode'] ?? ''));
        $phoneRaw = (string)($body['phone'] ?? ($user['phone'] ?? ''));
        $phone = normalize_iranian_phone($phoneRaw);
        $isDefault = !empty($body['isDefault']) ? 1 : 0;

        if (mb_strlen($fullName) < 2 || is_placeholder_name($fullName)) {
            json_error('لطفاً نام و نام خانوادگی تحویل‌گیرنده را دقیق وارد نمایید', 400);
        }
        if ($phone === null) {
            json_error('لطفاً شماره موبایل معتبر تحویل‌گیرنده (مانند 09123456789) وارد نمایید', 400);
        }
        if (mb_strlen($state) < 2 || mb_strlen($city) < 2) {
            json_error('استان و شهر باید به طور کامل وارد شوند', 400);
        }
        if (mb_strlen($line1) < 10) {
            json_error('لطفاً نشانی دقیق پستی (خیابان، کوچه، پلاک و واحد) را حداقل در ۱۰ کاراکتر وارد نمایید', 400);
        }
        if ($postalCode === null) {
            json_error('کد پستی باید دقیقاً ۱۰ رقم بدون خط تیره باشد', 400);
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
            $id, $user['id'], $fullName, $line1, $line2,
            $city, $state, $postalCode, $phone, $isDefault
        ]);

        $address = format_address_row([
            'id' => $id,
            'full_name' => $fullName,
            'line1' => $line1,
            'line2' => $line2,
            'city' => $city,
            'state' => $state,
            'postal_code' => $postalCode,
            'country' => 'IR',
            'phone' => $phone,
            'is_default' => $isDefault,
        ]);

        json_response(['id' => $id, 'success' => true, 'address' => $address], 201);
    }

    // 3. Delete Address: DELETE /{id}
    if (preg_match('#^/([a-zA-Z0-9_\-]+)$#', $subpath, $matches) && $method === 'DELETE') {
        $addrId = $matches[1];
        $pdo->prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?")->execute([$addrId, $user['id']]);
        json_response(['success' => true]);
    }

    json_error('مسیر آدرس پیدا نشد', 404);
}
