<?php
/**
 * Rootwood Group — Automatic Database Initializer
 * Runs safely on container startup: creates schema and runs seed only if database is uninitialized.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

echo "[auto-init] Checking database readiness...\n";

$pdo = null;
$maxRetries = 15;
for ($i = 1; $i <= $maxRetries; $i++) {
    try {
        $pdo = get_db();
        $pdo->query("SELECT 1");
        echo "[auto-init] Database connected successfully on attempt $i.\n";
        break;
    } catch (Throwable $e) {
        echo "[auto-init] Attempt $i/$maxRetries failed: " . $e->getMessage() . ". Retrying in 2s...\n";
        sleep(2);
    }
}

if (!$pdo) {
    echo "[auto-init] Warning: Database connection could not be established after $maxRetries attempts. Skipping auto-init.\n";
    exit(0);
}

try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'");
    $hasUsers = (int)$stmt->fetchColumn() > 0;

    if ($hasUsers) {
        echo "[auto-init] Database is already initialized. Skipping schema/seed.\n";
        exit(0);
    }

    echo "[auto-init] Fresh database detected. Applying schema.sql...\n";
    $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
    if ($schemaSql === false) {
        throw new RuntimeException("Could not read schema.sql");
    }

    $pdo->exec($schemaSql);
    echo "[auto-init] Schema applied successfully.\n";

    echo "[auto-init] Running seed script...\n";
    require_once __DIR__ . '/seed.php';
    if (function_exists('run_seed')) {
        run_seed();
    }
    echo "[auto-init] Database initialization complete!\n";
} catch (Throwable $e) {
    echo "[auto-init] Error during database initialization: " . $e->getMessage() . "\n";
}
