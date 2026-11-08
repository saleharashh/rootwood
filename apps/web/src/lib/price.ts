const faNumber = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

/**
 * Formats a price stored in Toman, e.g. 18_500_000 -> "۱۸٬۵۰۰٬۰۰۰ تومان".
 */
export function formatPrice(toman: number): string {
  return `${faNumber.format(toman)} تومان`;
}

export const formatPriceToman = formatPrice;

/** Compact form for tight spaces */
export function formatPriceShort(toman: number): string {
  return formatPrice(toman);
}

/** Persian (Jalali) date, e.g. "۱۲ مهر ۱۴۰۵" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("fa-IR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

export const formatJalaliDate = formatDate;

/** Persian digit count, e.g. 3 -> "۳" */
export function formatCount(value: number): string {
  return faNumber.format(value);
}

export function toPersianDigits(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}
