"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import type { AuthUser } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingBag, X, Menu, LayoutDashboard, User } from "lucide-react";

const NAV_LINKS = [
  { href: "/products", label: "محصولات" },
  { href: "/products?featured=true", label: "پرفروش‌ها" },
  { href: "/blog", label: "مجله" },
  { href: "/about", label: "کارگاه ما" },
  { href: "/contact", label: "تماس" },
];

function BrandMark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="group flex items-center gap-3 text-[var(--color-wood)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-wood)] font-serif text-sm font-bold tracking-wider text-[#faf7f2] transition-transform duration-200 group-hover:scale-105">
        CR
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold tracking-tight">کرفتدرات</span>
        <span className="mt-1 hidden text-[11px] font-medium text-[var(--color-ink-mute)] sm:block">
          کارگاه مبلمان چوبی
        </span>
      </span>
    </Link>
  );
}

function MobileMenu({ onClose, user }: { onClose: () => void; user: AuthUser | null }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { openAuth } = useStoreDialogs();

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      id="mobile-menu"
      className="glass-overlay fixed inset-0 z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="منوی اصلی"
        className="animate-drawer glass-scroll flex h-full w-[85vw] max-w-sm flex-col justify-between overflow-y-auto border-s border-[var(--color-border)] bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div>
          <div className="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <BrandMark onNavigate={onClose} />
            <button
              type="button"
              aria-label="بستن منو"
              className="icon-btn h-10 w-10 rounded-xl"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 text-base" aria-label="منوی ناوبری موبایل">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="rounded-xl px-4 py-3 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)] active:scale-[0.99]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          {user ? (
            <div className="flex flex-col gap-1.5">
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <User className="h-5 w-5 text-[var(--color-accent)]" />
                <span>حساب {user.name}</span>
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[var(--color-accent-strong)] transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>پنل مدیریت کارگاه</span>
                </Link>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuth();
              }}
              className="btn btn-primary w-full py-3.5 text-base font-bold"
            >
              ورود یا ساخت حساب
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useCart();
  const { user } = useAuth();
  const { openCart, openAuth } = useStoreDialogs();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const itemCount = cart?.summary.itemCount ?? 0;

  useEffect(() => {
    if (!searchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!search.trim()) return;
    setSearchOpen(false);
    router.push(`/products?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <>
      <header className="sticky top-0 z-30 w-full px-3 pt-3 sm:px-6">
        <div className="glass-bar mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl px-4 sm:px-6">
          <BrandMark />

          <nav className="hidden md:flex md:items-center md:gap-1.5">
            {NAV_LINKS.map((link) => {
              const path = link.href.split("?")[0];
              const active = !link.href.includes("?") && pathname.startsWith(path);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--color-surface-2)] text-[var(--color-wood)] font-semibold"
                      : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="icon-btn h-10 w-10 sm:h-9 sm:w-auto gap-2 sm:px-3 sm:py-2 text-sm font-medium"
              onClick={() => setSearchOpen(true)}
              aria-label="جستجو"
            >
              <Search className="h-4.5 w-4.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="hidden lg:inline">جستجو</span>
            </button>

            <button
              type="button"
              onClick={openCart}
              className="icon-btn relative h-10 w-10 sm:h-9 sm:w-auto cursor-pointer gap-2 sm:px-3 sm:py-2 text-sm font-medium"
              aria-label={`سبد خرید، ${itemCount} کالا`}
              aria-haspopup="dialog"
            >
              <ShoppingBag className="h-5 w-5 sm:h-4.5 sm:w-4.5" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="animate-badge-pop absolute -start-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white shadow-xs">
                  {itemCount > 99 ? "۹۹+" : itemCount.toLocaleString("fa-IR")}
                </span>
              )}
              <span className="hidden lg:inline">سبد خرید</span>
            </button>

            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="icon-btn h-10 w-10 sm:h-9 sm:w-auto gap-2 sm:px-3 sm:py-2 text-sm font-medium text-[var(--color-accent-strong)]"
                    aria-label="پنل مدیریت"
                  >
                    <LayoutDashboard className="h-4.5 w-4.5" aria-hidden="true" />
                    <span className="hidden lg:inline">مدیریت</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  className="icon-btn h-10 w-10 sm:h-9 sm:w-auto gap-2 sm:px-3 sm:py-2 text-sm font-medium"
                  aria-label={`حساب کاربری ${user.name}`}
                >
                  <User className="h-4.5 w-4.5" aria-hidden="true" />
                  <span className="hidden lg:inline">{user.name}</span>
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openAuth()}
                aria-haspopup="dialog"
                className="btn btn-primary hidden cursor-pointer px-4 py-2 text-sm sm:inline-flex"
              >
                ورود
              </button>
            )}

            <button
              type="button"
              className="icon-btn h-10 w-10 rounded-xl md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} user={user} />}

      {searchOpen && (
        <div
          className="glass-overlay fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 sm:pt-28"
          onClick={() => setSearchOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="جستجوی محصولات"
            className="glass-panel w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={submitSearch} className="flex items-center gap-3 p-4 sm:p-5">
              <button
                type="submit"
                aria-label="جستجوی محصولات"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-accent-strong)] transition-colors hover:bg-[var(--color-border)]"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو در محصولات (میز، نشیمن، صندلی، نوع چوب…)"
                aria-label="جستجوی محصولات"
                enterKeyHint="search"
                className="min-w-0 flex-1 bg-transparent text-base sm:text-lg text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-mute)]"
                autoFocus
                maxLength={80}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="icon-btn h-9 w-9"
                aria-label="بستن جستجو"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
            {search.trim() ? (
              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-sm text-[var(--color-ink-soft)]">
                کلید Enter را برای جستجوی «<strong className="text-[var(--color-wood)]">{search}</strong>» فشار دهید.
              </div>
            ) : (
              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-xs text-[var(--color-ink-mute)]">
                می‌توانید نام قطعه یا نوع چوب مثل «بلوط»، «گردو»، «توت» یا «میز» را جستجو کنید.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
