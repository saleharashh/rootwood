/**
 * Shared commerce constants and status metadata.
 * Single source of truth for the storefront and the admin panel.
 */

/** Must match FREE_SHIPPING_THRESHOLD in backend/cart.php. */
export const FREE_SHIPPING_FALLBACK = 5_000_000;

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderStatusMeta {
  label: string;
  badgeClass: string;
  next?: OrderStatus;
}

export const ORDER_STATUSES: Record<OrderStatus, OrderStatusMeta> = {
  PENDING: {
    label: "در انتظار پرداخت",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    next: "PAID",
  },
  PAID: {
    label: "پرداخت‌شده",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    next: "PROCESSING",
  },
  PROCESSING: {
    label: "در حال ساخت",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    next: "SHIPPED",
  },
  SHIPPED: {
    label: "ارسال‌شده",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-200",
    next: "DELIVERED",
  },
  DELIVERED: {
    label: "تحویل‌شده",
    badgeClass: "bg-stone-100 text-stone-800 border-stone-200",
  },
  CANCELLED: {
    label: "لغو‌شده",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
  },
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUSES).map(
  ([value, meta]) => ({ value: value as OrderStatus, label: meta.label })
);

export function orderStatusMeta(status: string): OrderStatusMeta {
  return (
    ORDER_STATUSES[status as OrderStatus] ?? {
      label: status,
      badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
    }
  );
}

export function nextOrderStatus(status: string): OrderStatus | null {
  return ORDER_STATUSES[status as OrderStatus]?.next ?? null;
}

export type ContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export const CONTACT_STATUSES: Record<ContactStatus, { label: string; badgeClass: string }> = {
  NEW: {
    label: "جدید",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
  },
  IN_PROGRESS: {
    label: "در حال بررسی",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  RESOLVED: {
    label: "پاسخ داده شد",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

export function contactStatusMeta(status: string) {
  return (
    CONTACT_STATUSES[status as ContactStatus] ?? {
      label: status,
      badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
    }
  );
}
