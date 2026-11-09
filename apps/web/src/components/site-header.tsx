import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  ShoppingBag,
  User as UserIcon,
  Shield,
  Menu,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Compass,
  Layers,
  Flame,
  Hammer,
  BookOpen,
  Phone,
  Truck,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useStoreDialogs } from "./store-dialogs";
import { Sheet, SheetHeader } from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function SiteHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { openAuth, openCart, openSearch } = useStoreDialogs();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(true);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);

  // Close drawer & menu on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setProductsMenuOpen(false);
  }, [location]);

  const categories = [
    { name: "میزهای اسلب و جلومبلی", slug: "tables", desc: "اسلب‌های یکپارچه گردو و چنار" },
    { name: "صندلی و نشیمن ارگونومیک", slug: "seating", desc: "اتصالات کام و زبانه دست‌ساز" },
    { name: "شلف، بوفه و کتابخانه", slug: "storage", desc: "سیستم‌های ذخیره‌سازی چوبی روستیک" },
    { name: "ظروف و اکسسوری چوبی", slug: "decor", desc: "خراطی ظریف از چوب توت و گردو" },
  ];

  const isProductsActive = location.startsWith("/products");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e8ded3] bg-[#faf8f5]/95 backdrop-blur-md transition-all">
      {/* Top Banner Notice (30% Secondary structure / warm linen) */}
      <div className="bg-[#f4ece4] text-[#655347] border-b border-[#e8ded3] text-[11px] py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#b85d19] shrink-0" />
        <span className="truncate">ارسال رایگان سفارش‌های بالای ۲۰ میلیون تومان همراه با شناسنامه اصالت چوب روت‌وود</span>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Right Section: Mobile Hamburger + Logo + Desktop Nav */}
        <div className="flex items-center gap-3 sm:gap-6 lg:gap-7 flex-nowrap">
          {/* Mobile Drawer Trigger (Hamburger) */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-[#655347] hover:text-[#b85d19] hover:bg-[#fdf1e7] transition-colors"
            aria-label="باز کردن منوی موبایل"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo (10% Accent Monogram + 30% Structural Title) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[#2b1e17] group focus:outline-none flex-nowrap shrink-0"
            aria-label="صفحه اصلی روت‌وود"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b85d19] text-white font-bold text-sm shadow-xs group-hover:bg-[#9e4e13] transition-colors tracking-wider font-serif shrink-0">
              RW
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-[#2b1e17] font-serif whitespace-nowrap">
              روت‌وود
            </span>
          </Link>

          {/* Desktop Navigation Links - Consolidated & balanced */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 flex-nowrap shrink-0">
            {/* Unified 3-in-1: Products, Categories & Bestsellers Mega-Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setProductsMenuOpen(true)}
              onMouseLeave={() => setProductsMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setProductsMenuOpen(!productsMenuOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isProductsActive
                    ? "bg-[#fdf1e7] text-[#b85d19] font-bold"
                    : "text-[#655347] hover:text-[#b85d19] hover:bg-[#fdf1e7]/60"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#b85d19]" />
                <span>محصولات و دسته‌بندی‌ها</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${productsMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Hover Dropdown Menu */}
              <div
                className={`absolute top-full right-0 mt-1.5 w-80 rounded-2xl border border-[#e8ded3] bg-white/98 backdrop-blur-md shadow-xl p-2.5 transition-all duration-200 z-50 ${
                  productsMenuOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2 pointer-events-none"
                }`}
              >
                {/* Top Quick Actions: All Products + Bestsellers */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#f4ece4]/70 rounded-xl mb-2 border border-[#e8ded3]/80">
                  <Link
                    href="/products"
                    onClick={() => setProductsMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white text-xs font-bold text-[#2b1e17] hover:text-[#b85d19] hover:shadow-xs transition-all border border-[#e8ded3]/60"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#b85d19]" />
                    <span>تمامی آثار</span>
                  </Link>
                  <Link
                    href="/products?featured=true"
                    onClick={() => setProductsMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#fdf1e7] text-xs font-bold text-[#b85d19] hover:bg-[#fae6d4] transition-all border border-[#edd1bc]"
                  >
                    <Flame className="w-3.5 h-3.5 text-[#b85d19]" />
                    <span>پرفروش‌ترین‌ها</span>
                  </Link>
                </div>

                {/* Categories list */}
                <div className="px-2 py-1.5 flex items-center justify-between text-[11px] font-bold text-[#8c796e] uppercase tracking-wider">
                  <span>مجموعه‌های چوب طبیعی</span>
                  <span className="text-[10px] text-[#b85d19] font-medium">{categories.length} دسته</span>
                </div>

                <div className="space-y-0.5">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      onClick={() => setProductsMenuOpen(false)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[#fdf1e7] transition-colors group/item"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#2b1e17] group-hover/item:text-[#b85d19] transition-colors">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-[#655347]">
                          {c.desc}
                        </span>
                      </div>
                      <ArrowLeft className="w-3.5 h-3.5 text-[#8c796e] group-hover/item:-translate-x-1 group-hover/item:text-[#b85d19] transition-all" />
                    </Link>
                  ))}
                </div>

                <div className="pt-2 mt-1.5 border-t border-[#f0e7dd] text-center">
                  <Link
                    href="/products"
                    onClick={() => setProductsMenuOpen(false)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#b85d19] hover:underline py-0.5"
                  >
                    <span>مشاهده کاتالوگ با فیلتر گونه چوب و ابعاد</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bespoke Custom Orders */}
            <Link
              href="/contact"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                location === "/contact"
                  ? "bg-[#fdf1e7] text-[#b85d19] font-bold"
                  : "text-[#655347] hover:text-[#b85d19] hover:bg-[#fdf1e7]/60"
              }`}
            >
              سفارش ساخت
            </Link>

            {/* Track Order */}
            <Link
              href="/track"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                location === "/track"
                  ? "bg-[#fdf1e7] text-[#b85d19] font-bold"
                  : "text-[#655347] hover:text-[#b85d19] hover:bg-[#fdf1e7]/60"
              }`}
            >
              پیگیری سفارش
            </Link>

            {/* Journal */}
            <Link
              href="/blog"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                location.startsWith("/blog")
                  ? "bg-[#fdf1e7] text-[#b85d19] font-bold"
                  : "text-[#655347] hover:text-[#b85d19] hover:bg-[#fdf1e7]/60"
              }`}
            >
              مجله
            </Link>

            {/* About Workshop */}
            <Link
              href="/about"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                location === "/about"
                  ? "bg-[#fdf1e7] text-[#b85d19] font-bold"
                  : "text-[#655347] hover:text-[#b85d19] hover:bg-[#fdf1e7]/60"
              }`}
            >
              درباره ما
            </Link>
          </nav>
        </div>

        {/* Left Section: Compact Actions (Search + Cart + Account) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap shrink-0">
          {/* Search Trigger Button - 30% Structural Icon */}
          <button
            type="button"
            onClick={openSearch}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#e8ded3] bg-white text-[#655347] hover:border-[#b85d19]/40 hover:text-[#b85d19] hover:bg-[#fdf1e7]/50 transition-colors shrink-0 shadow-2xs"
            aria-label="جستجوی آثار"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Cart Trigger Button - Icon Button with 10% Accent Count Badge */}
          <button
            type="button"
            onClick={openCart}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-[#e8ded3] bg-white text-[#2b1e17] hover:border-[#b85d19]/40 hover:text-[#b85d19] hover:bg-[#fdf1e7]/50 transition-colors shrink-0 shadow-2xs"
            aria-label={`سبد خرید، ${itemCount} قلم کالا`}
          >
            <ShoppingBag className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 text-[10px] font-bold rounded-full bg-[#b85d19] text-white shadow-xs">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Account / Auth Button */}
          {user ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button
                    variant="wood"
                    size="sm"
                    className="gap-1.5 hidden xl:inline-flex text-xs h-9 px-2.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-200" />
                    <span>پنل</span>
                  </Button>
                </Link>
              )}

              <Link href="/account">
                <button
                  type="button"
                  className="h-9 px-2 sm:px-2.5 flex items-center gap-1.5 rounded-xl border border-[#e8ded3] bg-white hover:border-[#b85d19]/40 hover:bg-[#fdf1e7]/50 transition-colors shrink-0 shadow-2xs text-[#2b1e17]"
                  aria-label={`حساب کاربری ${user.name}`}
                >
                  <div className="w-6 h-6 rounded-full bg-[#b85d19] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[70px] truncate font-medium text-xs hidden sm:inline">
                    {user.name}
                  </span>
                </button>
              </Link>
            </div>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => openAuth("signin")}
              className="h-9 px-3 text-xs gap-1.5 shrink-0 whitespace-nowrap bg-[#b85d19] hover:bg-[#9e4e13]"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>ورود / ثبت‌نام</span>
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE NAVIGATION DRAWER (RTL Slide-In Sheet from Right)                  */}
      {/* ========================================================================= */}
      <Sheet open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} side="right">
        {/* Drawer Header */}
        <SheetHeader onClose={() => setMobileDrawerOpen(false)}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b85d19] text-white font-bold font-serif text-sm">
              RW
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-[#2b1e17] leading-tight">روت‌وود</h2>
              <p className="text-[11px] text-[#b85d19] font-medium">آتلیه و نجاری دست‌ساز</p>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#faf8f5]">
          {/* User Account Quick Card inside Drawer */}
          <div className="bg-white p-4 rounded-2xl border border-[#e8ded3] shadow-2xs">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#b85d19] text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2b1e17]">{user.name}</div>
                    <div className="text-[11px] text-[#8c796e]">{user.phone || user.email}</div>
                  </div>
                </div>
                <Link
                  href="/account"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-xs font-semibold text-[#b85d19] bg-[#fdf1e7] px-3 py-1.5 rounded-lg border border-[#edd1bc]"
                >
                  حساب
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-5 h-5 text-[#b85d19]" />
                  <div>
                    <div className="text-xs font-bold text-[#2b1e17]">حساب کاربری</div>
                    <div className="text-[11px] text-[#8c796e]">برای پیگیری سفارشات وارد شوید</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    openAuth("signin");
                  }}
                  className="text-xs h-8 px-3"
                >
                  ورود / ثبت‌نام
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Links Group */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#8c796e] uppercase tracking-wider block px-2 mb-2">
              بخش‌های آتلیه روت‌وود
            </span>

            {/* Home */}
            <Link
              href="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-[#2b1e17] hover:bg-[#fdf1e7]/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-[#8c796e]" />
                <span>صفحه اصلی</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-[#8c796e]" />
            </Link>

            {/* Unified 3-in-1: Products, Bestsellers & Categories Accordion */}
            <div className="rounded-2xl border border-[#e8ded3] bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                className="w-full flex items-center justify-between p-3.5 text-sm font-bold text-[#2b1e17] hover:bg-[#fdf1e7]/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#b85d19]" />
                  <span>محصولات و دسته‌بندی‌ها</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#8c796e] transition-transform duration-200 ${
                    mobileProductsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {mobileProductsOpen && (
                <div className="p-2.5 pt-0 space-y-1.5 border-t border-[#f0e7dd] bg-[#faf8f5]/60">
                  {/* Quick Pills: All Products + Bestsellers */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    <Link
                      href="/products"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white text-xs font-bold text-[#2b1e17] border border-[#e8ded3] shadow-2xs hover:bg-[#fdf1e7]"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#b85d19]" />
                      <span>تمامی آثار</span>
                    </Link>
                    <Link
                      href="/products?featured=true"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#fdf1e7] text-xs font-bold text-[#b85d19] border border-[#edd1bc] shadow-2xs hover:bg-[#fae6d4]"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#b85d19]" />
                      <span>پرفروش‌ها</span>
                    </Link>
                  </div>

                  {/* Categories List */}
                  <div className="pt-2 pb-0.5 px-1">
                    <span className="text-[10px] font-bold text-[#8c796e] uppercase tracking-wider block">
                      دسته‌بندی‌های چوب طبیعی
                    </span>
                  </div>

                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-[#2b1e17] bg-white hover:bg-[#fdf1e7] hover:text-[#b85d19] transition-colors border border-[#e8ded3]/60"
                    >
                      <span>{c.name}</span>
                      <ArrowLeft className="w-3.5 h-3.5 text-[#8c796e]" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Bespoke Custom Orders */}
            <Link
              href="/contact"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-[#2b1e17] hover:bg-[#fdf1e7]/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Hammer className="w-4 h-4 text-[#8c796e]" />
                <span>سفارش ساخت اختصاصی</span>
              </div>
              <Badge variant="wood" className="text-[10px]">ابعاد دلخواه</Badge>
            </Link>

            {/* Track Order */}
            <Link
              href="/track"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-[#2b1e17] hover:bg-[#fdf1e7]/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-[#8c796e]" />
                <span>پیگیری ساخت و ارسال</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-[#8c796e]" />
            </Link>

            {/* Journal */}
            <Link
              href="/blog"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-[#2b1e17] hover:bg-[#fdf1e7]/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-[#8c796e]" />
                <span>مجله و مقالات چوب</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-[#8c796e]" />
            </Link>

            {/* About */}
            <Link
              href="/about"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-[#2b1e17] hover:bg-[#fdf1e7]/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-[#8c796e]" />
                <span>داستان کارگاه روت‌وود</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-[#8c796e]" />
            </Link>
          </div>

          <Separator />

          {/* Workshop Contact Details Card in Drawer */}
          <div className="space-y-3 p-4 bg-[#f4ece4] rounded-2xl text-xs text-[#655347] border border-[#e8ded3]">
            <div className="flex items-center gap-2 font-bold text-[#2b1e17] text-xs">
              <Phone className="w-3.5 h-3.5 text-[#b85d19]" />
              <span>تماس مستقیم با استودیو:</span>
            </div>
            <div className="flex justify-between items-center" dir="ltr">
              <span className="font-mono text-[#2b1e17] font-bold">021 - 8877 6655</span>
              <span className="text-[11px] text-[#8c796e]">(۹ صبح الی ۶ عصر)</span>
            </div>
            <p className="text-[11px] text-[#8c796e] leading-relaxed">
              تهران، خیابان ولیعصر، بالاتر از پارک ساعی، استودیو روت‌وود
            </p>
          </div>
        </div>

        {/* Drawer Bottom Footer with Cart Button (10% Accent CTA) */}
        <div className="p-4 border-t border-[#e8ded3] bg-white sticky bottom-0">
          <Button
            type="button"
            className="w-full justify-between bg-[#b85d19] hover:bg-[#9e4e13] text-white"
            onClick={() => {
              setMobileDrawerOpen(false);
              openCart();
            }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده سبد خرید</span>
            </div>
            <span className="bg-[#87400d] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount} کالا
            </span>
          </Button>
        </div>
      </Sheet>
    </header>
  );
}
