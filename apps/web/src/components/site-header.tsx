import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Phone, Shield, ShoppingBag, Sparkles, User as UserIcon } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useStoreDialogs } from "./store-dialogs";
import { Sheet, SheetContent, SheetHeader } from "./ui/sheet";
import { Button } from "./ui/button";
import { SITE_CONTACT, FEATURE_FLAGS } from "@/lib/site-config";
import { FREE_SHIPPING_FALLBACK } from "@/lib/commerce";
import { formatPriceToman } from "@/lib/price";
import { isSyntheticEmail } from "@/lib/validation";

const NAV_LINKS = [
  ...(FEATURE_FLAGS.showProducts
    ? [{ href: "/products", label: "محصولات", match: (p: string) => p.startsWith("/products") }]
    : []),
  { href: "/gallery", label: "گالری آثار", match: (p: string) => p.startsWith("/gallery") },
  { href: "/contact", label: "سفارش ساخت", match: (p: string) => p === "/contact" },
  { href: "/blog", label: "مجله", match: (p: string) => p.startsWith("/blog") },
  { href: "/about", label: "درباره ما", match: (p: string) => p === "/about" },
];

export function SiteHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { itemCount, initialLoading } = useCart();
  const { openAuth, openCart } = useStoreDialogs();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-canvas)]/95 backdrop-blur-md">
      <div className="flex items-center justify-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-1 text-[11px] font-medium text-[var(--color-ink-soft)]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
        <span className="truncate">
          ارسال رایگان سفارش‌های بالای {formatPriceToman(FREE_SHIPPING_FALLBACK)} همراه با شناسنامه
          اصالت چوب
        </span>
      </div>

      <div className="mx-auto grid h-16 max-w-7xl grid-cols-3 items-center px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:px-8">
        <div className="flex items-center justify-self-start md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
            aria-label="باز کردن منو"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-self-center md:justify-self-start">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="صفحه اصلی روت‌وود">
            <img
              src={SITE_CONTACT.logoSrc}
              alt="لوگوی روت‌وود"
              width={40}
              height={40}
              decoding="async"
              className="h-10 w-10 shrink-0 object-contain transition-transform hover:scale-105"
            />
            <span className="whitespace-nowrap font-serif text-base font-black tracking-tight text-[var(--color-ink)] sm:text-lg">
              روت‌وود
            </span>
          </Link>
        </div>

        <nav className="hidden shrink-0 items-center justify-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = link.match(location);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition-all ${
                  active
                    ? "bg-[var(--color-accent-soft)] font-bold text-[var(--color-accent)]"
                    : "font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)]/60 hover:text-[var(--color-accent)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-2">
          {FEATURE_FLAGS.showCart && (
            <button
              type="button"
              onClick={openCart}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
              aria-label={`سبد خرید، ${itemCount} قلم`}
            >
              <ShoppingBag className="h-4 w-4" />
              {!initialLoading && itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          {FEATURE_FLAGS.showAuth ? (
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              {user ? (
                <Link href="/account">
                  <button
                    type="button"
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-2.5 text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]/40"
                    aria-label={`حساب کاربری ${user.name}`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white">
                      {user.name.charAt(0)}
                    </span>
                    <span className="max-w-[85px] truncate text-xs font-medium">{user.name}</span>
                  </button>
                </Link>
              ) : (
                <Button type="button" size="sm" onClick={openAuth} className="h-9 gap-1.5 px-3 text-xs">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>ورود / ثبت‌نام</span>
                </Button>
              )}
            </div>
          ) : user?.role === "ADMIN" ? (
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <Link href="/admin">
                <Button type="button" size="sm" variant="outline" className="h-9 gap-1.5 px-3 text-xs">
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                  <span>پنل مدیریت</span>
                </Button>
              </Link>
            </div>
          ) : null}

          {!FEATURE_FLAGS.showAuth && !FEATURE_FLAGS.showCart && (
            <a
              href={SITE_CONTACT.telHref}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              dir="ltr"
            >
              <Phone className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              <span className="hidden sm:inline">{SITE_CONTACT.phone}</span>
            </a>
          )}
        </div>
      </div>

      <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} side="right">
        <SheetHeader onClose={() => setDrawerOpen(false)}>
          <div className="flex items-center gap-2.5">
            <img
              src={SITE_CONTACT.logoSrc}
              alt="لوگوی روت‌وود"
              width={40}
              height={40}
              decoding="async"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <div>
              <h2 className="font-serif text-base font-bold leading-tight text-[var(--color-ink)]">
                روت‌وود
              </h2>
              <p className="text-[11px] font-medium text-[var(--color-accent)]">
                آتلیه و نجاری دست‌ساز
              </p>
            </div>
          </div>
        </SheetHeader>

        <SheetContent className="space-y-6">
          {FEATURE_FLAGS.showAuth ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                        {user.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-[var(--color-ink)]">
                          {user.name}
                        </div>
                        <div className="truncate font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                          {user.phone || (!isSyntheticEmail(user.email) ? user.email : "")}
                        </div>
                      </div>
                    </div>
                    <Link href="/account" className="text-xs font-semibold text-[var(--color-accent)]">
                      حساب من
                    </Link>
                  </div>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      <Shield className="h-3.5 w-3.5 text-amber-200" />
                      پنل مدیریت آتلیه
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[var(--color-ink)]">حساب کاربری</div>
                    <div className="text-[11px] text-[var(--color-ink-muted)]">
                      ورود سریع با شماره موبایل
                    </div>
                  </div>
                  <Button size="sm" onClick={openAuth} className="h-8 shrink-0 px-3 text-xs">
                    ورود
                  </Button>
                </div>
              )}
            </div>
          ) : user?.role === "ADMIN" ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <Link
                href="/admin"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] px-3 py-2 text-xs font-semibold text-white"
              >
                <Shield className="h-3.5 w-3.5 text-amber-200" />
                پنل مدیریت آتلیه
              </Link>
            </div>
          ) : null}

          <nav className="space-y-1">
            {[
              { href: "/", label: "صفحه اصلی", match: (path: string) => path === "/" },
              ...NAV_LINKS,
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  link.match(location)
                    ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs text-[var(--color-ink-soft)]">
            <div className="flex items-center gap-2 font-bold text-[var(--color-ink)]">
              <Phone className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              تماس مستقیم و ایتا
            </div>
            <a
              href={SITE_CONTACT.telHref}
              dir="ltr"
              className="block font-mono font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
            >
              {SITE_CONTACT.phone}
            </a>
            <p className="text-[11px] leading-relaxed">{SITE_CONTACT.address}</p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
