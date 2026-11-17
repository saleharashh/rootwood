/**
 * Shared client-side digit normalization and validation helpers
 * mirroring backend/helpers.php rules.
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toEnglishDigits(raw: string): string {
  let out = raw;
  for (let i = 0; i < 10; i++) {
    out = out.replaceAll(PERSIAN_DIGITS[i], String(i)).replaceAll(ARABIC_DIGITS[i], String(i));
  }
  return out;
}

export function normalizeIranianPhone(raw: string): string | null {
  let cleaned = toEnglishDigits(raw.trim()).replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+98")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("0098")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (/^98(9\d{9})$/.test(cleaned)) {
    cleaned = "0" + cleaned.slice(2);
  } else if (/^9\d{9}$/.test(cleaned)) {
    cleaned = "0" + cleaned;
  }

  return /^09\d{9}$/.test(cleaned) ? cleaned : null;
}

export function normalizePostalCode(raw: string): string | null {
  const digits = toEnglishDigits(raw.trim()).replace(/\D/g, "");
  return /^\d{10}$/.test(digits) ? digits : null;
}

export function isPlaceholderUserName(name?: string | null): boolean {
  const trimmed = (name || "").trim();
  if (trimmed.length < 2) return true;
  return /^کاربر\s*[0-9۰-۹]{3,}$/u.test(trimmed);
}

export function isSyntheticEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith("@craftedroot.local");
}
