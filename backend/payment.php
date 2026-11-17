<?php
/**
 * Rootwood Group — Payment Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/orders.php';

const TOMAN_TO_RIAL = 10;

/**
 * POST a JSON payload to a gateway and decode its JSON response.
 * Returns [data, error, httpStatus].
 */
function payment_post_json(string $url, array $payload): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $raw = curl_exec($ch);
    $error = curl_error($ch);
    $httpStatus = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = is_string($raw) ? json_decode($raw, true) : null;

    return [
        'data' => is_array($data) ? $data : null,
        'error' => $error !== '' ? $error : null,
        'httpStatus' => $httpStatus,
    ];
}

function payment_order_payload(PDO $pdo, string $orderId): ?array {
    $stmt = $pdo->prepare("
        SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
        LIMIT 1
    ");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    return $order ? format_order_row($order, $pdo) : null;
}

function handle_payment(string $subpath, string $method): void {
    $config = require __DIR__ . '/config.php';
    $pdo = get_db();
    $payCfg = $config['payment'];
    $isProduction = ($config['env'] === 'production');
    $allowSimulation = !$isProduction && $payCfg['simulation'];
    $hasZarinpal = !empty($payCfg['zarinpal_merchant']);
    $hasZibal = !empty($payCfg['zibal_merchant']);

    // 1. Get Gateways List
    if ($subpath === '/gateways' && $method === 'GET') {
        json_response([
            [
                'id' => 'zarinpal',
                'name' => 'درگاه پرداخت زرین‌پال',
                'logo' => '/gateways/zarinpal.svg',
                'isLive' => $hasZarinpal && !$payCfg['zarinpal_sandbox'],
                'isConfigured' => $hasZarinpal,
                'isAvailable' => $hasZarinpal || $allowSimulation,
                'description' => 'پرداخت امن با کلیه کارت‌های عضو شتاب از طریق زرین‌پال',
            ],
            [
                'id' => 'zibal',
                'name' => 'درگاه پرداخت زیبال',
                'logo' => '/gateways/zibal.svg',
                'isLive' => $hasZibal && !$payCfg['zibal_sandbox'],
                'isConfigured' => $hasZibal,
                'isAvailable' => $hasZibal || $allowSimulation,
                'description' => 'پرداخت سریع و مطمئن با کلیه کارت‌های بانکی از طریق زیبال',
            ],
        ]);
    }

    $user = require_auth();

    // 2. Initiate Payment: POST /initiate
    if ($subpath === '/initiate' && $method === 'POST') {
        $body = get_json_input();
        $orderId = trim($body['orderId'] ?? '');
        $gateway = trim($body['gateway'] ?? 'zarinpal');

        if (!in_array($gateway, ['zarinpal', 'zibal', 'simulated'], true)) {
            json_error('درگاه پرداخت انتخابی نامعتبر است', 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
        $stmt->execute([$orderId, $user['id']]);
        $order = $stmt->fetch();

        if (!$order) {
            json_error('سفارش مورد نظر پیدا نشد', 404);
        }
        if ($order['status'] === 'PAID') {
            json_error('این سفارش قبلاً پرداخت شده است', 400);
        }
        if ($order['status'] !== 'PENDING') {
            json_error('وضعیت سفارش اجازه پرداخت نمی‌دهد', 400);
        }

        $totalToman = (int)$order['total'];
        if ($totalToman <= 0) {
            json_error('مبلغ سفارش نامعتبر است', 400);
        }

        if ($gateway === 'simulated' && !$allowSimulation) {
            json_error('درگاه شبیه‌سازی‌شده در این محیط غیرفعال است', 400);
        }

        // Server-derived callback URL (prevents open redirect).
        // Gateways append their own query string (`?Authority=...&Status=OK` for
        // Zarinpal, `?trackId=...&success=1` for Zibal), so it must stay query-free.
        $callbackUrl = $config['site_url'] . "/checkout/callback";

        $trackId = null;
        $paymentUrl = null;
        $isSimulated = false;

        if ($gateway === 'zarinpal' && $hasZarinpal) {
            // Real Zarinpal v4 request
            $reqUrl = $payCfg['zarinpal_sandbox']
                ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
                : 'https://payment.zarinpal.com/pg/v4/payment/request.json';

            $postData = [
                'merchant_id' => $payCfg['zarinpal_merchant'],
                'amount' => $totalToman * TOMAN_TO_RIAL, // Toman to Rial
                'description' => "سفارش {$order['order_number']} روت‌وود گروپ",
                'callback_url' => $callbackUrl,
            ];

            $metadata = [];
            if (!empty($user['phone'])) {
                $metadata['mobile'] = $user['phone'];
            }
            if (!empty($user['email']) && !str_ends_with((string)$user['email'], '@craftedroot.local')) {
                $metadata['email'] = $user['email'];
            }
            if ($metadata !== []) {
                $postData['metadata'] = $metadata;
            }

            $result = payment_post_json($reqUrl, $postData);
            $data = $result['data'];

            if ($result['error'] !== null) {
                json_error('خطا در ارتباط با درگاه پرداخت زرین‌پال', 502);
            }

            if (!empty($data['data']['authority']) && (int)($data['data']['code'] ?? 0) === 100) {
                $trackId = $data['data']['authority'];
                $paymentUrl = 'https://payment.zarinpal.com/pg/StartPay/' . $trackId;
                if ($payCfg['zarinpal_sandbox']) {
                    $paymentUrl = 'https://sandbox.zarinpal.com/pg/StartPay/' . $trackId;
                }
            } else {
                $gatewayMessage = is_array($data['errors'] ?? null) && !empty($data['errors']['message'])
                    ? (string)$data['errors']['message']
                    : null;
                json_error(
                    $gatewayMessage
                        ? "خطا در ارتباط با درگاه پرداخت زرین‌پال: {$gatewayMessage}"
                        : 'خطا در ارتباط با درگاه پرداخت زرین‌پال',
                    502
                );
            }
        } elseif ($gateway === 'zibal' && $hasZibal) {
            // Real Zibal request
            $postData = [
                'merchant' => $payCfg['zibal_merchant'],
                'amount' => $totalToman * TOMAN_TO_RIAL,
                'callbackUrl' => $callbackUrl,
                'orderId' => $order['order_number'],
            ];

            $result = payment_post_json('https://gateway.zibal.ir/v1/request', $postData);
            $data = $result['data'];

            if ($result['error'] !== null) {
                json_error('خطا در ارتباط با درگاه پرداخت زیبال', 502);
            }

            if (!empty($data['trackId']) && (int)($data['result'] ?? 0) === 100) {
                $trackId = (string)$data['trackId'];
                $paymentUrl = "https://gateway.zibal.ir/start/$trackId";
            } else {
                json_error('خطا در ارتباط با درگاه پرداخت زیبال', 502);
            }
        } elseif ($allowSimulation) {
            // Simulated payment in development
            $isSimulated = true;
            $trackId = 'SIM_' . bin2hex(random_bytes(10));
            $sep = (strpos($callbackUrl, '?') !== false) ? '&' : '?';
            $paymentUrl = ($gateway === 'zarinpal' || $gateway === 'simulated')
                ? "{$callbackUrl}{$sep}Authority={$trackId}&Status=OK"
                : "{$callbackUrl}{$sep}trackId={$trackId}&success=1";
        } else {
            json_error('درگاه پرداخت انتخاب‌شده پیکربندی نشده است', 400);
        }

        // Store transaction in database
        $pdo->prepare("
            INSERT INTO payment_transactions (id, order_id, gateway, amount, status, track_id)
            VALUES (?, ?, ?, ?, 'PENDING', ?)
        ")->execute([generate_uuid(), $order['id'], $gateway, $totalToman, $trackId]);

        $pdo->prepare("UPDATE orders SET payment_gateway = ?, payment_track_id = ? WHERE id = ?")
            ->execute([$gateway, $trackId, $order['id']]);

        json_response([
            'paymentUrl' => $paymentUrl,
            'trackId' => $trackId,
            'gateway' => $gateway,
            'orderId' => $order['id'],
            'orderNumber' => $order['order_number'],
            'amount' => $totalToman,
            'isSimulated' => $isSimulated,
        ]);
    }

    // 3. Verify Payment: POST /verify
    if ($subpath === '/verify' && $method === 'POST') {
        $body = get_json_input();
        $trackId = trim((string)($body['trackId'] ?? $body['authority'] ?? $body['Authority'] ?? ''));
        $gateway = trim((string)($body['gateway'] ?? ''));
        $status = strtoupper(trim((string)($body['status'] ?? '')));

        if ($trackId === '') {
            json_error('اطلاعات تراکنش ارسالی ناقص است', 400);
        }

        // The gateway comes from the stored transaction; the client may only
        // narrow the lookup, never choose which gateway verifies a track id.
        $sql = "
            SELECT pt.*, o.id AS order_id, o.order_number, o.total, o.status AS order_status
            FROM payment_transactions pt
            JOIN orders o ON pt.order_id = o.id
            WHERE pt.track_id = ? AND o.user_id = ?
        ";
        $params = [$trackId, $user['id']];
        if ($gateway !== '') {
            $sql .= " AND pt.gateway = ?";
            $params[] = $gateway;
        }
        $sql .= " LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $tx = $stmt->fetch();

        if (!$tx) {
            json_error('تراکنش پرداخت مربوطه پیدا نشد', 404);
        }

        $gateway = (string)$tx['gateway'];
        $isSimulatedTrack = str_starts_with($trackId, 'SIM_');

        // Idempotency: already settled successfully
        if ($tx['status'] === 'SUCCESS' || $tx['order_status'] === 'PAID') {
            json_response([
                'success' => true,
                'verified' => true,
                'message' => 'این تراکنش پیش‌تر با موفقیت تأیید شده است.',
                'gateway' => $gateway,
                'orderId' => $tx['order_id'],
                'orderNumber' => $tx['order_number'],
                'amount' => (int)$tx['total'],
                'refId' => $tx['ref_id'] ?? 'SIM-PAID',
                'cardPan' => $tx['card_pan'],
                'paidAt' => $tx['updated_at'],
                'order' => payment_order_payload($pdo, (string)$tx['order_id']),
            ]);
        }

        // User cancelled or the bank reported a failure: do not call verify.
        if ($status !== '' && $status !== 'OK') {
            $pdo->prepare("UPDATE payment_transactions SET status = 'FAILED', error_message = ? WHERE id = ?")
                ->execute(['پرداخت ناموفق یا لغوشده توسط کاربر', $tx['id']]);
            json_error('پرداخت انجام نشد یا توسط شما لغو شد', 400);
        }

        $refId = null;
        $cardPan = null;

        if ($isSimulatedTrack) {
            if (!$allowSimulation) {
                json_error('تأیید تراکنش شبیه‌سازی‌شده در این محیط مسدود است', 400);
            }
            $refId = 'SIM-' . time();
            $cardPan = '603799******1234';
        } elseif ($gateway === 'zarinpal') {
            if (!$hasZarinpal) {
                json_error('درگاه زرین‌پال پیکربندی نشده است', 400);
            }

            $verUrl = $payCfg['zarinpal_sandbox']
                ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
                : 'https://payment.zarinpal.com/pg/v4/payment/verify.json';

            $result = payment_post_json($verUrl, [
                'merchant_id' => $payCfg['zarinpal_merchant'],
                'amount' => (int)$tx['total'] * TOMAN_TO_RIAL,
                'authority' => $trackId,
            ]);
            $data = $result['data'];
            $code = (int)($data['data']['code'] ?? 0);

            // 100 = verified, 101 = already verified (idempotent success)
            if ($code === 100 || $code === 101) {
                $refId = (string)($data['data']['ref_id'] ?? 'REF-ZARINPAL');
                $cardPan = $data['data']['card_pan'] ?? null;
            } else {
                $pdo->prepare("UPDATE payment_transactions SET status = 'FAILED', error_message = ? WHERE id = ?")
                    ->execute(['تأیید درگاه زرین‌پال ناموفق بود', $tx['id']]);
                json_error('پرداخت در درگاه زرین‌پال تایید نشد', 400);
            }
        } elseif ($gateway === 'zibal') {
            if (!$hasZibal) {
                json_error('درگاه زیبال پیکربندی نشده است', 400);
            }

            $result = payment_post_json('https://gateway.zibal.ir/v1/verify', [
                'merchant' => $payCfg['zibal_merchant'],
                'trackId' => (int)$trackId,
            ]);
            $data = $result['data'];
            $resultCode = (int)($data['result'] ?? 0);

            // 100 = verified, 201 = already verified
            if ($resultCode === 100 || $resultCode === 201) {
                $refId = (string)($data['refNumber'] ?? 'REF-ZIBAL');
                $cardPan = $data['cardNumber'] ?? null;
            } else {
                $pdo->prepare("UPDATE payment_transactions SET status = 'FAILED', error_message = ? WHERE id = ?")
                    ->execute(['تأیید درگاه زیبال ناموفق بود', $tx['id']]);
                json_error('پرداخت در درگاه زیبال تایید نشد', 400);
            }
        } else {
            json_error('درگاه پرداخت تراکنش نامعتبر است', 400);
        }

        // Settle transaction and order atomically
        $now = date('Y-m-d H:i:s');
        $pdo->beginTransaction();
        try {
            $pdo->prepare("UPDATE payment_transactions SET status = 'SUCCESS', ref_id = ?, card_pan = ? WHERE id = ?")
                ->execute([$refId, $cardPan, $tx['id']]);

            $pdo->prepare("UPDATE orders SET status = 'PAID', payment_ref_id = ?, payment_card_pan = ?, paid_at = ? WHERE id = ?")
                ->execute([$refId, $cardPan, $now, $tx['order_id']]);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error('خطا در به‌روزرسانی وضعیت سفارش', 500);
        }

        json_response([
            'success' => true,
            'verified' => true,
            'message' => 'پرداخت با موفقیت تأیید شد.',
            'gateway' => $gateway,
            'orderId' => $tx['order_id'],
            'orderNumber' => $tx['order_number'],
            'amount' => (int)$tx['total'],
            'refId' => $refId,
            'cardPan' => $cardPan,
            'paidAt' => $now,
            'order' => payment_order_payload($pdo, (string)$tx['order_id']),
        ]);
    }

    json_error('مسیر پرداخت پیدا نشد', 404);
}
