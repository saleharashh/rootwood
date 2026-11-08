<?php
/**
 * Rootwood Group — Automated Host Deployment & Unzip Script
 * 
 * این اسکریپت فایل rootwood-deployment.zip را در پوشه فعلی (معمولاً public_html)
 * استخراج کرده و تنظیمات اولیه را برای راه‌اندازی فرانت‌اند استاتیک و بک‌اند PHP فراهم می‌کند.
 */

declare(strict_types=1);

// Prevent browser caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Content-Type: text/html; charset=utf-8');

$zipFilename = 'rootwood-deployment.zip';
$targetDir = __DIR__;
$apiDir = $targetDir . '/api';
$envFile = $apiDir . '/.env';
$envExample = $apiDir . '/.env.example';
$schemaFile = $apiDir . '/schema.sql';
$seedFile = $apiDir . '/seed.php';

$action = $_POST['action'] ?? '';
$message = '';
$messageType = '';
$extractedCount = 0;

// ---------------------------------------------------------------------------
// Action: Self-Delete for Security
// ---------------------------------------------------------------------------
if ($action === 'cleanup') {
    $deletedZip = false;
    $deletedSelf = false;

    if (file_exists($targetDir . '/' . $zipFilename)) {
        $deletedZip = @unlink($targetDir . '/' . $zipFilename);
    }
    
    // Self-delete
    $deletedSelf = @unlink(__FILE__);

    echo '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>پاک‌سازی امنیتی</title>';
    echo '<style>body{font-family:Tahoma,sans-serif;background:#fafaf9;padding:40px;text-align:center;color:#1c1917;} .card{background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px;max-width:500px;margin:auto;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);}</style></head><body>';
    echo '<div class="card">';
    echo '<h2 style="color:#059669;margin-top:0;">پاک‌سازی امنیتی انجام شد</h2>';
    echo '<p style="color:#44403c;font-size:14px;line-height:1.7;">اسکریپت نصب و فایل زیپ برای جلوگیری از دسترسی افراد غیرمجاز با موفقیت از روی هاست حذف شدند.</p>';
    echo '<p style="margin-top:24px;"><a href="/" style="background:#78350f;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">ورود به فروشگاه روت‌وود</a></p>';
    echo '</div></body></html>';
    exit;
}

// ---------------------------------------------------------------------------
// Action: Extract ZIP
// ---------------------------------------------------------------------------
if ($action === 'extract') {
    $zipPath = $targetDir . '/' . $zipFilename;

    if (!file_exists($zipPath)) {
        $message = "فایل $zipFilename در این مسیر پیدا نشد. لطفاً فایل زیپ را در کنار این اسکریپت آپلود کنید.";
        $messageType = 'error';
    } elseif (!is_writable($targetDir)) {
        $message = "پوشه مقصد مجوز نوشتن ندارد. لطفاً دسترسی (Permissions) پوشه را روی 755 یا 777 قرار دهید.";
        $messageType = 'error';
    } else {
        $extracted = false;

        // Try ZipArchive first
        if (class_exists('ZipArchive')) {
            $zip = new ZipArchive();
            if ($zip->open($zipPath) === true) {
                $extractedCount = $zip->numFiles;
                $zip->extractTo($targetDir);
                $zip->close();
                $extracted = true;
            } else {
                $message = "خطا در باز کردن فایل زیپ با ZipArchive.";
                $messageType = 'error';
            }
        }

        // Fallback to exec('unzip') if ZipArchive fails or not available
        if (!$extracted && function_exists('exec')) {
            $out = [];
            $code = 0;
            @exec("unzip -o " . escapeshellarg($zipPath) . " -d " . escapeshellarg($targetDir), $out, $code);
            if ($code === 0) {
                $extracted = true;
                $extractedCount = count($out);
            }
        }

        if ($extracted) {
            // Create .env from .env.example if missing and generate cryptographically secure secrets
            if (file_exists($envExample) && !file_exists($envFile)) {
                $envContent = file_get_contents($envExample);
                $jwtSecret = bin2hex(random_bytes(32));
                $otpSecret = bin2hex(random_bytes(32));

                $envContent = str_replace(
                    'replace-with-a-very-long-random-secret-at-least-32-chars',
                    $jwtSecret,
                    $envContent
                );
                $envContent = str_replace(
                    'replace-with-a-random-secret-for-otp-hashing',
                    $otpSecret,
                    $envContent
                );

                // Auto-detect domain
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
                $proto = $isHttps ? 'https://' : 'http://';
                $currentUrl = $proto . $host;

                $envContent = str_replace('https://rootwoodgroup.ir/api', $currentUrl . '/api', $envContent);
                $envContent = str_replace('https://rootwoodgroup.ir', $currentUrl, $envContent);

                file_put_contents($envFile, $envContent);
            }

            $message = "تمامی فایل‌های پروژه ($extractedCount فایل) با موفقیت استخراج و مستقر شدند.";
            $messageType = 'success';
        } elseif (empty($message)) {
            $message = "ماژول ZipArchive روی سرور شما فعال نیست و دستور unzip نیز در دسترس نبود.";
            $messageType = 'error';
        }
    }
}

// ---------------------------------------------------------------------------
// Action: Update .env Database Credentials
// ---------------------------------------------------------------------------
if ($action === 'save_db') {
    if (file_exists($envFile) && is_writable($envFile)) {
        $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
        $dbName = trim($_POST['db_name'] ?? '');
        $dbUser = trim($_POST['db_user'] ?? '');
        $dbPass = trim($_POST['db_pass'] ?? '');

        $envContent = file_get_contents($envFile);
        $envContent = preg_replace('/^DB_HOST=.*$/m', "DB_HOST=$dbHost", $envContent);
        $envContent = preg_replace('/^DB_NAME=.*$/m', "DB_NAME=$dbName", $envContent);
        $envContent = preg_replace('/^DB_USER=.*$/m', "DB_USER=$dbUser", $envContent);
        $envContent = preg_replace('/^DB_PASS=.*$/m', "DB_PASS=$dbPass", $envContent);

        file_put_contents($envFile, $envContent);
        $message = "تنظیمات اتصال به دیتابیس در فایل api/.env ذخیره گردید.";
        $messageType = 'success';
    } else {
        $message = "فایل api/.env پیدا نشد یا دسترسی نوشتن ندارد. لطفاً ابتدا زیپ را استخراج کنید.";
        $messageType = 'error';
    }
}

// ---------------------------------------------------------------------------
// Action: Run Database Seed (Import initial data)
// ---------------------------------------------------------------------------
if ($action === 'run_seed') {
    if (file_exists($seedFile)) {
        ob_start();
        try {
            include $seedFile;
            $seedOutput = ob_get_clean();
            $message = "سید اطلاعات اولیه با موفقیت در دیتابیس ذخیره شد.";
            $messageType = 'success';
        } catch (Throwable $e) {
            ob_end_clean();
            $message = "خطا در اجرای سید دیتابیس: " . $e->getMessage();
            $messageType = 'error';
        }
    } else {
        $message = "فایل seed.php در پوشه api یافت نشد.";
        $messageType = 'error';
    }
}

// System Environment Checks
$phpVersion = PHP_VERSION;
$hasZip = class_exists('ZipArchive');
$isWritable = is_writable($targetDir);
$hasZipFile = file_exists($targetDir . '/' . $zipFilename);
$zipSize = $hasZipFile ? round(filesize($targetDir . '/' . $zipFilename) / (1024 * 1024), 2) : 0;
$isExtracted = file_exists($targetDir . '/index.html') && file_exists($apiDir . '/index.php');

// Read current db config if .env exists
$currentDb = ['host' => '127.0.0.1', 'name' => '', 'user' => '', 'pass' => ''];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (str_starts_with($line, 'DB_HOST=')) $currentDb['host'] = substr($line, 8);
        if (str_starts_with($line, 'DB_NAME=')) $currentDb['name'] = substr($line, 8);
        if (str_starts_with($line, 'DB_USER=')) $currentDb['user'] = substr($line, 8);
        if (str_starts_with($line, 'DB_PASS=')) $currentDb['pass'] = substr($line, 8);
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استخراج و راه‌اندازی هاست · Rootwood Group</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #fcfbf9;
      --surface: #ffffff;
      --border: #e7e5e4;
      --ink: #1c1917;
      --muted: #78716c;
      --accent: #78350f;
      --accent-hover: #92400e;
      --success: #059669;
      --error: #dc2626;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      background-color: var(--bg);
      color: var(--ink);
      line-height: 1.6;
      padding: 30px 16px;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 800;
      color: var(--accent);
      margin-bottom: 6px;
    }
    .header p {
      color: var(--muted);
      font-size: 14px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px -2px rgba(0,0,0,0.05);
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 14px;
      color: var(--ink);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .alert {
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 14px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .alert-success {
      background-color: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-error {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f5f5f4;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-ok { background: #d1fae5; color: #065f46; }
    .badge-warn { background: #fef3c7; color: #92400e; }
    .badge-fail { background: #fee2e2; color: #991b1b; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--accent);
      color: #ffffff;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
      width: 100%;
    }
    .btn:hover { background: var(--accent-hover); }
    .btn-secondary {
      background: #e7e5e4;
      color: #292524;
    }
    .btn-secondary:hover { background: #d6d3d1; }
    .btn-danger {
      background: var(--error);
      color: #fff;
    }
    .btn-danger:hover { background: #b91c1c; }
    .form-group {
      margin-bottom: 14px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #44403c;
      margin-bottom: 5px;
    }
    .form-control {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      font-size: 13px;
      font-family: inherit;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--accent);
    }
    .step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 600px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<div class="container">
  <div class="header">
    <h1>استخراج و راه‌اندازی هاست · Rootwood</h1>
    <p>سامانه استقرار خودکار فرانت‌اند استاتیک Vite و بک‌اند امن PHP/MySQL</p>
  </div>

  <?php if (!empty($message)): ?>
    <div class="alert alert-<?= $messageType ?>">
      <?= htmlspecialchars($message) ?>
    </div>
  <?php endif; ?>

  <!-- 1. System Health & Environment -->
  <div class="card">
    <div class="card-title">
      <span class="step-num">۱</span>
      <span>بررسی پیش‌نیازهای سرور و هاست</span>
    </div>
    <table class="table">
      <tr>
        <td>نگارش پی‌اچ‌پی (PHP Version)</td>
        <td style="text-align:left;">
          <span class="badge <?= version_compare($phpVersion, '8.0.0', '>=') ? 'badge-ok' : 'badge-fail' ?>">
            PHP <?= htmlspecialchars($phpVersion) ?>
          </span>
        </td>
      </tr>
      <tr>
        <td>ماژول اکستنشن ZipArchive</td>
        <td style="text-align:left;">
          <span class="badge <?= $hasZip ? 'badge-ok' : 'badge-fail' ?>">
            <?= $hasZip ? 'فعال و آماده' : 'غیرفعال (نیاز به unzip)' ?>
          </span>
        </td>
      </tr>
      <tr>
        <td>مجوز نوشتن در ریشه هاست (Writable)</td>
        <td style="text-align:left;">
          <span class="badge <?= $isWritable ? 'badge-ok' : 'badge-fail' ?>">
            <?= $isWritable ? 'مجاز' : 'غیرمجاز (خطای دسترسی 755)' ?>
          </span>
        </td>
      </tr>
      <tr>
        <td>شناسایی فایل پکیج (<?= htmlspecialchars($zipFilename) ?>)</td>
        <td style="text-align:left;">
          <span class="badge <?= $hasZipFile ? 'badge-ok' : 'badge-fail' ?>">
            <?= $hasZipFile ? "موجود ({$zipSize} مگابایت)" : 'یافت نشد' ?>
          </span>
        </td>
      </tr>
    </table>
  </div>

  <!-- 2. Extraction Block -->
  <div class="card">
    <div class="card-title">
      <span class="step-num">۲</span>
      <span>استخراج پکیج روی هاست</span>
    </div>
    <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">
      با فشردن دکمه زیر، فایل زیپ در همین مسیر استخراج شده و فایل‌های استاتیک فرانت‌اند و بک‌اند در مسیر <code>api/</code> مستقر می‌شوند.
    </p>

    <form method="post">
      <input type="hidden" name="action" value="extract">
      <button type="submit" class="btn" <?= (!$hasZipFile || !$isWritable) ? 'disabled' : '' ?>>
        📦 استخراج و استقرار کامل فایل‌ها (Unzip)
      </button>
    </form>
  </div>

  <?php if ($isExtracted): ?>
  <!-- 3. Database Configuration -->
  <div class="card">
    <div class="card-title">
      <span class="step-num">۳</span>
      <span>تنظیمات پایگاه داده MySQL</span>
    </div>
    <p style="font-size: 13px; color: var(--muted); margin-bottom: 14px;">
      یک پایگاه داده در cPanel ایجاد کنید، سپس فایل <code>api/schema.sql</code> را در phpMyAdmin ایمپورت نموده و مشخصات زیر را تکمیل کنید:
    </p>

    <form method="post">
      <input type="hidden" name="action" value="save_db">
      <div class="grid-2">
        <div class="form-group">
          <label>نام پایگاه داده (DB_NAME)</label>
          <input type="text" name="db_name" class="form-control" value="<?= htmlspecialchars($currentDb['name']) ?>" required placeholder="مثال: cpaneluser_rootwood">
        </div>
        <div class="form-group">
          <label>نام کاربری پایگاه داده (DB_USER)</label>
          <input type="text" name="db_user" class="form-control" value="<?= htmlspecialchars($currentDb['user']) ?>" required placeholder="مثال: cpaneluser_rootwood">
        </div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>رمز عبور پایگاه داده (DB_PASS)</label>
          <input type="password" name="db_pass" class="form-control" value="<?= htmlspecialchars($currentDb['pass']) ?>" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label>سرور دیتابیس (DB_HOST)</label>
          <input type="text" name="db_host" class="form-control" value="<?= htmlspecialchars($currentDb['host']) ?>" required>
        </div>
      </div>

      <button type="submit" class="btn btn-secondary">
        💾 ذخیره مشخصات در فایل api/.env
      </button>
    </form>

    <div style="margin-top: 18px; pt-2; border-top: 1px solid var(--border); padding-top: 14px;">
      <p style="font-size: 12px; color: var(--muted); margin-bottom: 10px;">
        اختیاری: برای وارد کردن داده‌های نمونه (محصولات، مقالات، دسته ها و حساب دمو):
      </p>
      <form method="post">
        <input type="hidden" name="action" value="run_seed">
        <button type="submit" class="btn btn-secondary" style="font-size: 13px;">
          🌱 اجرای سید آزمایشی در پایگاه داده (Seed Data)
        </button>
      </form>
    </div>
  </div>

  <!-- 4. Security Cleanup -->
  <div class="card" style="border-color: #fecaca; background: #fffaf0;">
    <div class="card-title" style="color: var(--error);">
      <span class="step-num" style="background: var(--error);">۴</span>
      <span>اقدام حیاتی امنیتی: حذف فایل نصبی</span>
    </div>
    <p style="font-size: 13px; color: #78350f; margin-bottom: 16px; line-height: 1.7;">
      <strong>هشدار امنیتی:</strong> پس از اتمام استخراج و تنظیم دیتابیس، حتماً دکمه زیر را بزنید تا فایل‌های <code>unzip.php</code> و <code><?= htmlspecialchars($zipFilename) ?></code> از روی هاست به صورت قطعی حذف گردند تا از دسترسی افراد ناشناس جلوگیری شود.
    </p>

    <form method="post" onsubmit="return confirm('آیا از حذف امنیتی فایل‌های نصبی unzip.php و فایل زیپ اطمینان دارید؟');">
      <input type="hidden" name="action" value="cleanup">
      <button type="submit" class="btn btn-danger">
        🗑️ حذف امنیتی unzip.php و فایل زیپ
      </button>
    </form>
  </div>
  <?php endif; ?>

  <div style="text-align: center; margin-top: 20px;">
    <a href="/" target="_blank" style="color: var(--accent); font-size: 13px; font-weight: 600; text-decoration: none;">
      مشاهده فروشگاه در تب جدید ←
    </a>
  </div>
</div>

</body>
</html>
