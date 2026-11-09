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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setCategoryMenuOpen(false);
  }, [location]);

  const categories = [
    { name: "میزهای اسلب و جلومبلی", slug: "tables", desc: "اسلب‌های یکپارچه گردو و چنار" },
    { name: "صندلی و نشیمن ارگونومیک", slug: "seating", desc: "اتصالات کام و زبانه دست‌ساز" },
    { name: "شلف، بوفه و کتابخانه", slug: "storage", desc: "سیستم‌های ذخیره‌سازی چوبی روستیک" },
    { name: "ظروف و اکسسوری چوبی", slug: "decor", desc: "خراطی ظریف از چوب توت و گردو" },
  ];

  const isBestsellerActive = location.includes("featured=true");
  const isProductsActive = location.startsWith("/products") && !isBestsellerActive;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#eddcd0]/90 bg-[#fcfaf7]/95 backdrop-blur-md transition-all">
      {/* Top Banner Notice - Warm subtle beige strip */}
      <div className="bg-[#f8ede2] text-[#78401d] border-b border-[#eddcd0]/80 text-[11px] py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#8c4f27] shrink-0" />
        <span className="truncate">ارسال رایگان سفارش‌های بالای ۲۰ میلیون تومان همراه با شناسنامه اصالت چوب روت‌وود</span>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Right Section: Mobile Hamburger + Logo + Desktop Nav */}
        <div className="flex items-center gap-3 sm:gap-6 lg:gap-7 flex-nowrap">
          {/* Mobile Drawer Trigger (Hamburger) */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-stone-700 hover:text-[#8c4f27] hover:bg-[#f8ede2] transition-colors"
            aria-label="باز کردن منوی موبایل"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo - Single Line, Never Wraps */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-stone-900 group focus:outline-none flex-nowrap shrink-0"
            aria-label="صفحه اصلی روت‌وود"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8c4f27] text-white font-bold text-sm shadow-xs group-hover:bg-[#78401d] transition-colors tracking-wider font-serif shrink-0">
              RW
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-stone-900 font-serif whitespace-nowrap">
              روت‌وود
            </span>
          </Link>

          {/* Desktop Navigation Links - Compact, Single-line, No wrapping */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-nowrap shrink-0">
            {/* 1. All Products */}
            <Link
              href="/products"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                isProductsActive
                  ? "bg-[#f8ede2] text-[#8c4f27] font-bold"
                  : "text-stone-700 hover:text-[#8c4f27] hover:bg-[#f8ede2]/60"
              }`}
            >
              محصولات
            </Link>

            {/* 2. Bestsellers */}
            <Link
              href="/products?featured=true"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isBestsellerActive
                  ? "bg-[#f8ede2] text-[#8c4f27] font-bold"
                  : "text-stone-700 hover:text-[#8c4f27] hover:bg-[#f8ede2]/60"
              }`}
            >
              <span>پرفروش‌ها</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8c4f27]" />
            </Link>

            {/* 3. Categories Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                onMouseEnter={() => setCategoryMenuOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium text-stone-700 hover:text-[#8c4f27] hover:bg-[#f8ede2]/60 whitespace-nowrap transition-all flex items-center gap-1"
              >
                <span>دسته‌بندی‌ها</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
              </button>

              {/* Hover Dropdown Card */}
              <div
                onMouseLeave={() => setCategoryMenuOpen(false)}
                className={`absolute top-full right-0 mt-1 w-72 rounded-2xl border border-[#eddcd0] bg-white/95 backdrop-blur-md shadow-xl p-2 transition-all duration-200 z-50 ${
                  categoryMenuOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible -translate-y-2 pointer-events-none"
                }`}
              >
                <div className="p-2 border-b border-stone-100 mb-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    مجموعه‌های چوب طبیعی
                  </span>
                </div>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/products?category=${c.slug}`}
                    onClick={() => setCategoryMenuOpen(false)}
                    className="flex flex-col p-2.5 rounded-xl hover:bg-[#f8ede2]/70 transition-colors group/item"
                  >
                    <span className="text-xs font-bold text-stone-900 group-hover/item:text-[#8c4f27]">
                      {c.name}
                    </span>
                    <span className="text-[11px] text-stone-500 line-clamp-1">
                      {c.desc}
                    </span>
                  </Link>
                ))}
                <div className="pt-2 mt-1 border-t border-stone-100">
                  <Link
                    href="/products"
                    onClick={() => setCategoryMenuOpen(false)}
                    className="text-center block text-xs font-bold text-[#8c4f27] hover:underline py-1"
                  >
                    مشاهده تمامی گروه‌ها ←
                  </Link>
                </div>
              </div>
            </div>

            {/* 4. Bespoke Custom Orders */}
            <Link
              href="/contact"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                location === "/contact"
                  ? "bg-[#f8ede2] text-[#8c4f27] font-bold"
                  : "text-stone-700 hover:text-[#8c4f27] hover:bg-[#f8ede2]/60"
              }`}
            >
              سفارش ساخت
            </Link>

            {/* 5. Journal */}
            <Link
              href="/blog"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                location.startsWith("/blog")
                  ? "bg-[#f8ede2] text-[#8c4f27] font-bold"
                  : "text-stone-700 hover:text-[#8c4f27] hover:bg-[#f8ede2]/60"
              }`}
            >
              مجله
            </Link>

            {/* 6. About Workshop */}
            <Link
              href="/about"
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-[13px] font-medium whitespace-nowrap transition-all ${
                location === "/about"
                  ? "bg-[#f8ede2] text-[#8c4f27] font-bold"
                  : "text-stone-700 hover:text-[#8c4f27] hover:bg-[#f8ede2]/60"
              }`}
            >
              درباره ما
            </Link>
          </nav>
        </div>

        {/* Left Section: Compact Actions (Search + Cart + Account) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap shrink-0">
          {/* Search Trigger Button - Icon Button */}
          <button
            type="button"
            onClick={openSearch}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#eddcd0] bg-white text-stone-600 hover:border-[#8c4f27]/50 hover:text-[#8c4f27] hover:bg-[#f8ede2]/50 transition-colors shrink-0 shadow-2xs"
            aria-label="جستجوی آثار"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Cart Trigger Button - Icon Button with Count Badge */}
          <button
            type="button"
            onClick={openCart}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-[#eddcd0] bg-white text-stone-700 hover:border-[#8c4f27]/50 hover:text-[#8c4f27] hover:bg-[#f8ede2]/50 transition-colors shrink-0 shadow-2xs"
            aria-label={`سبد خرید، ${itemCount} قلم کالا`}
          >
            <ShoppingBag className="w-4 h-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 text-[10px] font-bold rounded-full bg-[#8c4f27] text-white shadow-xs">
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
                  className="h-9 px-2 sm:px-2.5 flex items-center gap-1.5 rounded-xl border border-[#eddcd0] bg-white hover:border-[#8c4f27]/50 hover:bg-[#f8ede2]/50 transition-colors shrink-0 shadow-2xs text-stone-800"
                  aria-label={`حساب کاربری ${user.name}`}
                >
                  <div className="w-6 h-6 rounded-full bg-[#8c4f27] text-white flex items-center justify-center text-xs font-bold shrink-0">
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
              className="h-9 px-3 text-xs gap-1.5 shrink-0 whitespace-nowrap"
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8c4f27] text-white font-bold font-serif text-sm">
              RW
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-stone-900 leading-tight">روت‌وود</h2>
              <p className="text-[11px] text-[#8c4f27] font-medium">آتلیه و نجاری دست‌ساز</p>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* User Account Quick Card inside Drawer */}
          <div className="bg-white p-4 rounded-2xl border border-[#eddcd0] shadow-2xs">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#8c4f27] text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">{user.name}</div>
                    <div className="text-[11px] text-stone-500">{user.phone || user.email}</div>
                  </div>
                </div>
                <Link
                  href="/account"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-xs font-semibold text-[#8c4f27] bg-[#f8ede2] px-3 py-1.5 rounded-lg border border-[#eddcd0]"
                >
                  حساب
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-5 h-5 text-[#8c4f27]" />
                  <div>
                    <div className="text-xs font-bold text-stone-900">حساب کاربری</div>
                    <div className="text-[11px] text-stone-500">برای پیگیری سفارشات وارد شوید</div>
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
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block px-2 mb-2">
              بخش‌های آتلیه روت‌وود
            </span>

            {/* Home */}
            <Link
              href="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-[#f8ede2]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-stone-500" />
                <span>صفحه اصلی</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            {/* All Products */}
            <Link
              href="/products"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-[#f8ede2]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-stone-500" />
                <span>محصولات</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            {/* Bestsellers */}
            <Link
              href="/products?featured=true"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-[#8c4f27] bg-[#f8ede2] border border-[#eddcd0] hover:bg-[#f4e4d5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-[#8c4f27]" />
                <span>پرفروش‌ترین دست‌سازه‌ها</span>
              </div>
              <Badge variant="gold" className="text-[10px]">پیشنهاد ویژه</Badge>
            </Link>

            {/* Categories Accordion */}
            <div className="rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between p-3 text-sm font-semibold text-stone-800 hover:bg-[#f8ede2]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#8c4f27]" />
                  <span>دسته‌بندی‌های چوبی</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                    categoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div className="bg-[#f8ede2]/60 p-2 space-y-1 rounded-xl mr-3 my-1 border-r-2 border-[#8c4f27]/40">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block p-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-white hover:text-[#8c4f27] transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Bespoke Custom Orders */}
            <Link
              href="/contact"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-[#f8ede2]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Hammer className="w-4 h-4 text-stone-500" />
                <span>سفارش ساخت اختصاصی</span>
              </div>
              <Badge variant="wood" className="text-[10px]">ابعاد دلخواه</Badge>
            </Link>

            {/* Journal */}
            <Link
              href="/blog"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-[#f8ede2]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-stone-500" />
                <span>مجله و مقالات چوب</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            {/* About */}
            <Link
              href="/about"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-[#f8ede2]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-stone-500" />
                <span>داستان کارگاه روت‌وود</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
            </Link>
          </div>

          <Separator />

          {/* Workshop Contact Details Card in Drawer */}
          <div className="space-y-3 p-4 bg-[#f8ede2]/50 rounded-2xl text-xs text-stone-600 border border-[#eddcd0]/60">
            <div className="flex items-center gap-2 font-bold text-stone-800 text-xs">
              <Phone className="w-3.5 h-3.5 text-[#8c4f27]" />
              <span>تماس مستقیم با استودیو:</span>
            </div>
            <div className="flex justify-between items-center" dir="ltr">
              <span className="font-mono text-stone-800 font-bold">021 - 8877 6655</span>
              <span className="text-[11px] text-stone-500">(۹ صبح الی ۶ عصر)</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              تهران، خیابان ولیعصر، بالاتر از پارک ساعی، استودیو روت‌وود
            </p>
          </div>
        </div>

        {/* Drawer Bottom Footer with Cart Button */}
        <div className="p-4 border-t border-[#eddcd0] bg-white sticky bottom-0">
          <Button
            type="button"
            className="w-full justify-between"
            onClick={() => {
              setMobileDrawerOpen(false);
              openCart();
            }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده سبد خرید</span>
            </div>
            <span className="bg-[#78401d] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount} کالا
            </span>
          </Button>
        </div>
      </Sheet>
    </header>
  );
}
