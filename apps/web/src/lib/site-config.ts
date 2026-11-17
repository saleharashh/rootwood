export const SITE_NAME = "روت‌وود";
export const SITE_NAME_EN = "Rootwood Group";
export const SITE_DESCRIPTION =
  "مبلمان دست‌ساز از بلوط، گردو، گیلاس و توت ایرانی؛ میز، نشیمن، کتابخانه و دکور چوب طبیعی با شناسنامهٔ اصالت و ارسال به سراسر ایران.";

/**
 * Canonical origin of the storefront. Set `VITE_SITE_URL` at build time for
 * production so canonical/OG URLs never depend on the visitor's host.
 */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() ||
  (typeof window !== "undefined" ? window.location.origin : "https://rootwoodgroup.ir")
).replace(/\/+$/, "");

export const DEFAULT_OG_IMAGE = "/images/logo-512.png";

export const SITE_CONTACT = {
  phone: "09131534532",
  telHref: "tel:09131534532",
  address: "یزد، بلوار صابر یزدی غربی، ابتدای خیابان محمودی",
  city: "یزد",
  province: "یزد",
  country: "IR",
  email: "hello@craftedroot.com",
  hours: "شنبه تا پنج‌شنبه: ۹:۰۰ الی ۱۸:۰۰",
  logoSrc: "/images/logo-128.png",
} as const;

/**
 * تنظیمات نمایش یا مخفی‌سازی بخش‌های وب‌سایت
 * برای فعال یا مخفی کردن هر بخش، مقدار true یا false قرار دهید.
 */
export const FEATURE_FLAGS = {
  /** نمایش کاتالوگ و بخش‌های مربوط به محصولات (هدر، صفحه اصلی، فوتر) */
  showProducts: false,
  /** نمایش بخش ورود / ثبت‌نام و حساب کاربری */
  showAuth: false,
  /** نمایش سبد خرید */
  showCart: false,
};

