<?php
/**
 * Rootwood Group — Payment Handlers
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

const TOMAN_TO_RIAL = 10;

function handle_payment(string $subpath, string $method): void {
    $config = require __DIR__ . '/config.php';
    $pdo = get_db();
    $payCfg = $config['payment'];
    $isProduction = ($config['env'] === 'production');
    $allowSimulation = !$isProduction && $payCfg['simulation'];

    // 1. Get Gateways List
    if ($subpath === '/gateways' && $method === 'GET') {
        $hasZarinpal = !empty($payCfg['zarinpal_merchant']);
        $hasZibal = !empty($payCfg['zibal_merchant']);

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

        // Server derived callback URL (rejects open redirect vulnerability)
        $callbackUrl = $config['site_url'] . "/checkout/callback?gateway=$gateway";

        $trackId = null;
        $paymentUrl = null;
        $isSimulated = false;

        $hasZarinpal = !empty($payCfg['zarinpal_merchant']);
        $hasZibal = !empty($payCfg['zibal_merchant']);

        if ($gateway === 'zarinpal' && $hasZarinpal) {
            // Real Zarinpal Request
            $reqUrl = $payCfg['zarinpal_sandbox'] 
                ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json' 
                : 'https://payment.zarinpal.com/pg/v4/payment/request.json';
            
            $postData = [
                'merchant_id' => $payCfg['zarinpal_merchant'],
                'amount' => $totalToman * TOMAN_TO_RIAL, // Toman to Rial
                'description' => "سفارش {$order['order_number']} روت‌وود گروپ",
                'callback_url' => $callbackUrl,
            ];

            $ch = curl_init($reqUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $res = curl_exec($ch);
            curl_close($ch);

            $data = json_decode((string)$res, true);
            if (!empty($data['data']['authority']) && (int)($data['data']['code'] ?? 0) === 100) {
                $trackId = $data['data']['authority'];
                $paymentUrl = $payCfg['zarinpal_sandbox']
                    ? "https://sandbox.zarinpal.com/pg/StartPay/$trackId"
                    : "https://payment.zarinpal.com/pg/StartPay/$trackId";
            } else {
                json_error('خطا در ارتباط با درگاه پرداخت زرین‌پال', 502);
            }
        } elseif ($gateway === 'zibal' && $hasZibal) {
            // Real Zibal Request
            $postData = [
                'merchant' => $payCfg['zibal_merchant'],
                'amount' => $totalToman * TOMAN_TO_RIAL,
                'callbackUrl' => $callbackUrl,
                'orderId' => $order['order_number'],
            ];

            $ch = curl_init('https://gateway.zibal.ir/v1/request');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $res = curl_exec($ch);
            curl_close($ch);

            $data = json_decode((string)$res, true);
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
            $paymentUrl = ($gateway === 'zarinpal')
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
        $gateway = trim((string)($body['gateway'] ?? 'zarinpal'));
        if ($gateway === '') {
            $gateway = 'zarinpal';
        }

        if (!$trackId) {
            json_error('اطلاعات تراکنش ارسالی ناقص است', 400);
        }

        $stmt = $pdo->prepare("
            SELECT pt.*, o.id AS order_id, o.order_number, o.total, o.status AS order_status, o.user_id, o.email, o.shipping_address
            FROM payment_transactions pt
            JOIN orders o ON pt.order_id = o.id
            WHERE pt.track_id = ? AND pt.gateway = ? AND o.user_id = ?
        ");
        $stmt->execute([$trackId, $gateway, $user['id']]);
        $tx = $stmt->fetch();

        if (!$tx) {
            json_error('تراکنش پرداخت مربوطه پیدا نشد', 404);
        }

        // Idempotency: if already settled successfully
        if ($tx['status'] === 'SUCCESS' || $tx['order_status'] === 'PAID') {
            json_response([
                'success' => true,
                'orderId' => $tx['order_id'],
                'orderNumber' => $tx['order_number'],
                'amount' => (int)$tx['total'],
                'refId' => $tx['ref_id'] ?? 'SIM-PAID',
                'cardPan' => $tx['card_pan'],
                'paidAt' => $tx['updated_at'],
            ]);
        }

        $refId = null;
        $cardPan = null;

        if (str_starts_with($trackId, 'SIM_')) {
            if (!$allowSimulation) {
                json_error('تأیید تراکنش شبیه‌سازی‌شده در این محیط مسدود است', 400);
            }
            $refId = 'SIM-' . time();
            $cardPan = '603799******1234';
        } elseif ($gateway === 'zarinpal') {
            $verUrl = $payCfg['zarinpal_sandbox']
                ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
                : 'https://payment.zarinpal.com/pg/v4/payment/verify.json';
            
            $postData = [
                'merchant_id' => $payCfg['zarinpal_merchant'],
                'amount' => (int)$tx['total'] * TOMAN_TO_RIAL,
                'authority' => $trackId,
            ];

            $ch = curl_init($verUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $res = curl_exec($ch);
            curl_close($ch);

            $data = json_decode((string)$res, true);
            $code = (int)($data['data']['code'] ?? 0);
            if ($code === 100 || $code === 101) {
                $refId = (string)($data['data']['ref_id'] ?? 'REF-ZARINPAL');
                $cardPan = $data['data']['card_pan'] ?? null;
            } else {
                $pdo->prepare("UPDATE payment_transactions SET status = 'FAILED', error_message = ? WHERE id = ?")
                    ->execute(['تأیید درگاه زرین‌پال ناموفق بود', $tx['id']]);
                json_error('پرداخت در درگاه زرین‌پال تایید نشد', 400);
            }
        } elseif ($gateway === 'zibal') {
            $postData = [
                'merchant' => $payCfg['zibal_merchant'],
                'trackId' => (int)$trackId,
            ];

            $ch = curl_init('https://gateway.zibal.ir/v1/verify');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $res = curl_exec($ch);
            curl_close($ch);

            $data = json_decode((string)$res, true);
            $result = (int)($data['result'] ?? 0);
            if ($result === 100 || $result === 201) {
                $refId = (string)($data['refNumber'] ?? 'REF-ZIBAL');
                $cardPan = $data['cardNumber'] ?? null;
            } else {
                $pdo->prepare("UPDATE payment_transactions SET status = 'FAILED', error_message = ? WHERE id = ?")
                    ->execute(['تأیید درگاه زیبال ناموفق بود', $tx['id']]);
                json_error('پرداخت در درگاه زیبال تایید نشد', 400);
            }
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
            'orderId' => $tx['order_id'],
            'orderNumber' => $tx['order_number'],
            'amount' => (int)$tx['total'],
            'refId' => $refId,
            'cardPan' => $cardPan,
            'paidAt' => $now,
        ]);
    }

    json_error('مسیر پرداخت پیدا نشد', 404);
}
