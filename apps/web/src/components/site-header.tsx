import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, User as UserIcon, LayoutDashboard, Menu, X } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useStoreDialogs } from "./store-dialogs";

export function SiteHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { openAuth, openCart, openSearch } = useStoreDialogs();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/products", label: "محصولات" },
    { href: "/products?featured=true", label: "پرفروش‌ها" },
    { href: "/blog", label: "مجله" },
    { href: "/about", label: "کارگاه ما" },
    { href: "/contact", label: "تماس" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-[var(--color-wood)] focus:outline-hidden"
            aria-label="CR کرفتدرات کارگاه مبلمان چوبی"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-wood)] text-white font-bold text-sm shadow-xs tracking-wider">
              CR
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[var(--color-wood)]">
                روت‌وود گروپ
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[var(--color-accent)]">
                کارگاه مبلمان چوبی دست‌ساز
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 mr-4">
            {navLinks.map((link) => {
              const active = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[var(--color-surface-2)] text-[var(--color-accent-strong)]"
                      : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={openSearch}
            className="icon-btn h-10 px-3 gap-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] rounded-xl"
            aria-label="جستجو"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">جستجو</span>
          </button>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={openCart}
            className="icon-btn relative h-10 px-3 gap-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] rounded-xl"
            aria-label={`سبد خرید، ${itemCount} کالا`}
          >
            <ShoppingBag className="w-4.5 h-4.5 text-[var(--color-wood)]" />
            <span className="hidden sm:inline">سبد خرید</span>
            {itemCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[var(--color-accent)] text-white min-w-[18px]">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center gap-1.5">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="icon-btn h-10 px-3 gap-1.5 text-xs font-bold text-[var(--color-accent-strong)] bg-[var(--color-surface-2)] rounded-xl"
                  aria-label="پنل مدیریت"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline">مدیریت</span>
                </Link>
              )}
              <Link
                href="/account"
                className="icon-btn h-10 px-3 gap-1.5 text-xs font-bold text-[var(--color-wood)] hover:bg-[var(--color-surface-2)] rounded-xl"
                aria-label={`حساب کاربری ${user.name}`}
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden lg:inline">{user.name}</span>
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth("signin")}
              className="btn btn-primary text-xs font-bold px-4 py-2"
            >
              ورود
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="icon-btn h-10 w-10 md:hidden text-[var(--color-ink)]"
            aria-label="باز کردن منو"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-white px-4 py-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <div className="pt-3 border-t border-[var(--color-border)] flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuth("signin");
                }}
                className="btn btn-primary flex-1 text-xs py-2.5"
              >
                ورود با رمز عبور
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuth("otp");
                }}
                className="btn btn-ghost flex-1 text-xs py-2.5"
              >
                ورود سریع با پیامک
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
