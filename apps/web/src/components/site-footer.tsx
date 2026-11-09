import React from "react";
import { Link } from "wouter";
import { Hammer, ShieldCheck, Truck, Sparkles, MapPin, Phone, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white mt-20">
      {/* Values Banner */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-accent)] shadow-2xs">
                <Hammer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-wood)]">
                  چوب طبیعی و اصیل
                </h4>
                <p className="text-xs text-[var(--color-ink-mute)] mt-1">
                  ساخته شده از بلوط کهنسال، گردوی تیره و گیلاس با بافت زنده.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-accent)] shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-wood)]">
                  پرداخت ارگانیک غیرسمی
                </h4>
                <p className="text-xs text-[var(--color-ink-mute)] mt-1">
                  روغن‌های گیاهی نفوذگر و موم عسل، کاملاً ایمن برای خانواده.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-accent)] shadow-2xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-wood)]">
                  بسته‌بندی پالت چوبی
                </h4>
                <p className="text-xs text-[var(--color-ink-mute)] mt-1">
                  ارسال اختصاصی با کارتن چندلایه و پالت ضربه‌گیر به سراسر ایران.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-accent)] shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-wood)]">
                  سفارش‌سازی ابعاد
                </h4>
                <p className="text-xs text-[var(--color-ink-mute)] mt-1">
                  امکان ساخت سفارشی متناسب با متراژ و معماری خانه شما.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b85d19] text-white font-bold text-sm font-serif">
                RW
              </div>
              <div>
                <span className="text-base font-black text-[#2b1e17] font-serif">
                  Rootwood Group · روت‌وود
                </span>
                <p className="text-xs text-[var(--color-ink-mute)]">
                  کارگاه طراحی و ساخت مبلمان دست‌ساز
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-ink-soft)] max-w-sm">
              روت‌وود بازتابی از تعهد ما به زیبایی اصیل چوب و نجاری باکیفیت است.
              هر قطعه مبلمان با دست در کارگاه شکل می‌گیرد تا سالیان دراز همراه خانه‌تان باشد.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-wood)] uppercase tracking-wider mb-4">
              کاتالوگ کارگاه
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--color-ink-soft)]">
              <li>
                <Link href="/products?category=tables" className="hover:text-[var(--color-accent)]">
                  میزهای ناهارخوری و تحریر
                </Link>
              </li>
              <li>
                <Link href="/products?category=seating" className="hover:text-[var(--color-accent)]">
                  صندلی‌ها و نیمکت‌ها
                </Link>
              </li>
              <li>
                <Link href="/products?category=storage" className="hover:text-[var(--color-accent)]">
                  کتابخانه و دراور چوبی
                </Link>
              </li>
              <li>
                <Link href="/products?category=decor" className="hover:text-[var(--color-accent)]">
                  ظروف و اکسسوری‌های خراطی
                </Link>
              </li>
            </ul>
          </div>

          {/* Workshop & Support */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-wood)] uppercase tracking-wider mb-4">
              دسترسی سریع
            </h4>
            <ul className="space-y-2.5 text-xs text-[var(--color-ink-soft)]">
              <li>
                <Link href="/about" className="hover:text-[var(--color-accent)]">
                  درباره فلسفه کارگاه
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[var(--color-accent)]">
                  مجله تخصصی چوب و نگهداری
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--color-accent)]">
                  سفارش پروژه سفارشی
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-[var(--color-accent)]">
                  حساب کاربری و تاریخچه سفارش‌ها
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-wood)] uppercase tracking-wider mb-4">
              ارتباط با کارگاه
            </h4>
            <ul className="space-y-3 text-xs text-[var(--color-ink-soft)]">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                <span>تهران، منطقه صنعتی کمرد، خیابان کارگاه‌های چوب، پلاک ۲۴</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <span dir="ltr">۰۲۱-۷۷۸۸۹۹۰۰</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                <span>hello@craftedroot.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-ink-mute)] gap-3">
          <p>© {new Date().getFullYear()} Rootwood Group. تمام حقوق محفوظ است.</p>
          <p>طراحی و توسعه برای ارائه برترین کیفیت در دکوراسیون چوب طبیعی</p>
        </div>
      </div>
    </footer>
  );
}
