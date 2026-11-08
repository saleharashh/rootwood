const faNumber = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

/**
 * Formats a price stored in Toman, e.g. 18_500_000 -> "۱۸٬۵۰۰٬۰۰۰ تومان".
 * Order totals and product prices are stored in Toman across the database and
 * API; gateways receive Rial only at the payment boundary (see
 * `payment.service.ts`).
 */
export function formatPrice(toman: number): string {
  return `${faNumber.format(toman)} تومان`;
}

/** Compact form for tight spaces such as badges and drawers. */
export function formatPriceShort(toman: number): string {
  return formatPrice(toman);
}

/** Persian (Jalali) date, e.g. "۱۲ مهر ۱۴۰۵". */
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Persian digit count, e.g. 3 -> "۳". */
export function formatCount(value: number): string {
  return faNumber.format(value);
}
