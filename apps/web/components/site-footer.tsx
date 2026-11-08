import Link from "next/link";
import { CartDialogTrigger } from "@/components/cart-dialog-trigger";
import { formatCount } from "@/lib/price";

const footerLink =
  "text-sm font-medium text-[#ede1d1] transition-colors hover:text-white";
const footerHeading =
  "text-xs font-bold uppercase tracking-wider text-[#faf7f2]";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[#1c1612] text-[#f7f2ea]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-bold text-[#faf7f2]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf7f2] font-serif text-sm font-bold text-[#1c1612]">
                CR
              </span>
              <span>کرفتدرات</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[#ded4c5]">
              مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت
              ایرانی — ساخته‌شده برای زندگی روزمره در خانه‌هایی که به اصالت و چوب طبیعی
              اهمیت می‌دهند.
            </p>
            <address className="not-italic text-sm leading-7 text-[#ded4c5]">
              <div>کوچه خشت، محله قدیم</div>
              <div>شیراز، ایران</div>
              <a
                href="mailto:hello@craftedroot.com"
                className="font-medium text-[#f0e6d8] transition-colors hover:text-white underline underline-offset-4"
              >
                hello@craftedroot.com
              </a>
            </address>
          </div>

          <div>
            <h3 className={footerHeading}>فروشگاه</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/products", label: "همه محصولات" },
                { href: "/products?category=tables", label: "میزها" },
                { href: "/products?category=seating", label: "نشیمن" },
                { href: "/products?category=storage", label: "ذخیره‌سازی" },
                { href: "/products?category=decor", label: "دکور" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <CartDialogTrigger className={footerLink}>
                  سبد خرید
                </CartDialogTrigger>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={footerHeading}>کارگاه و محتوا</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/blog", label: "یادداشت‌های مجله" },
                { href: "/about", label: "فلسفه و کارگاه ما" },
                { href: "/contact", label: "سفارش اختصاصی و تماس" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={footerHeading}>نگهداری و شفافیت</h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: "/about", label: "پرداخت سطح و نگهداری روغن" },
                { href: "/contact", label: "ارسال امن و تضمین اصالت" },
                { href: "/signin", label: "ورود به حساب کاربری" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#382d24] pt-8 text-xs text-[#d8cdbf] sm:flex-row">
          <div>© {formatCount(year)} کرفتدرات. تمام حقوق محفوظ است — ساخت دست‌ساز در تیراژ محدود.</div>
          <div className="flex gap-6">
            <Link href="/contact" className="text-[#d8cdbf] transition-colors hover:text-white">
              پشتیبانی و سفارش
            </Link>
            <a
              href="mailto:hello@craftedroot.com"
              className="text-[#d8cdbf] transition-colors hover:text-white"
            >
              مکاتبه با کارگاه
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
