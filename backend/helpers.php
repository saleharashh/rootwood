<?php
/**
 * Rootwood Group — Shared Phone Normalization & Authorization Helpers
 */

declare(strict_types=1);

/**
 * Convert Persian and Arabic numerals to ASCII digits.
 */
function normalize_digits(string $raw): string {
    $persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    $arabic  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    $digits  = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    $out = str_replace($persian, $digits, $raw);
    return str_replace($arabic, $digits, $out);
}

/**
 * Normalize an Iranian mobile phone number to 09xxxxxxxxx format, or null if invalid.
 */
function normalize_iranian_phone(?string $raw): ?string {
    if ($raw === null) {
        return null;
    }

    $cleaned = normalize_digits(trim($raw));
    $cleaned = preg_replace('/[^\d+]/', '', $cleaned) ?? '';

    if (str_starts_with($cleaned, '+98')) {
        $cleaned = '0' . substr($cleaned, 3);
    } elseif (str_starts_with($cleaned, '0098')) {
        $cleaned = '0' . substr($cleaned, 4);
    } elseif (preg_match('/^98(9\d{9})$/', $cleaned, $m)) {
        $cleaned = '0' . $m[1];
    } elseif (preg_match('/^(9\d{9})$/', $cleaned, $m)) {
        $cleaned = '0' . $m[1];
    }

    if (preg_match('/^09\d{9}$/', $cleaned)) {
        return $cleaned;
    }

    return null;
}

/**
 * Normalize a 10-digit Iranian postal code, or null if invalid.
 */
function normalize_postal_code(?string $raw): ?string {
    if ($raw === null) {
        return null;
    }

    $digits = preg_replace('/\D/', '', normalize_digits(trim($raw))) ?? '';
    return preg_match('/^\d{10}$/', $digits) ? $digits : null;
}

/**
 * Check whether a phone number belongs to the strictly allowed workshop admins.
 */
function is_admin_phone(?string $phone): bool {
    $normalized = normalize_iranian_phone($phone);
    if ($normalized === null) {
        return false;
    }

    $config = require __DIR__ . '/config.php';
    $allowed = $config['auth']['admin_phones'] ?? ['09131534532', '09134398431'];

    foreach ($allowed as $candidate) {
        $normCandidate = normalize_iranian_phone((string)$candidate);
        if ($normCandidate !== null && hash_equals($normCandidate, $normalized)) {
            return true;
        }
    }

    return false;
}

/**
 * Detect whether a user's name is still empty or an auto-generated OTP placeholder ("کاربر XXXX").
 */
function is_placeholder_name(?string $name): bool {
    $trimmed = trim((string)$name);
    if (mb_strlen($trimmed) < 2) {
        return true;
    }

    return (bool)preg_match('/^کاربر\s*[0-9۰-۹]{3,}$/u', $trimmed);
}
