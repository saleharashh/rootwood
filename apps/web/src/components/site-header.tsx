import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  ShoppingBag,
  User as UserIcon,
  Shield,
  Menu,
  X,
  Flame,
  Layers,
  Sparkles,
  BookOpen,
  Phone,
  Compass,
  ChevronDown,
  ArrowLeft,
  Hammer,
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
  const { itemCount, subtotal } = useCart();
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
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-[#fdfcfa]/90 backdrop-blur-md transition-all">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-950 via-[#271912] to-amber-950 text-amber-100 text-[11px] py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>ارسال رایگان سراسر کشور برای سفارش‌های بالای ۲۰ میلیون تومان همراه با شناسنامه اصالت چوب</span>
      </div>

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Right Section: Mobile Hamburger + Logo + Desktop Nav */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile Drawer Trigger (Hamburger) */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
            aria-label="باز کردن منوی موبایل"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 text-stone-900 group focus:outline-none"
            aria-label="صفحه اصلی روت‌وود"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-950 text-amber-50 font-bold text-base shadow-sm group-hover:bg-amber-900 transition-colors tracking-widest font-serif">
              RW
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-stone-900 font-serif leading-tight">
                روت‌وود گروپ
              </span>
              <span className="text-[10px] font-semibold text-amber-900 tracking-wide">
                آتلیه مبلمان و دست‌سازه‌های چوبی
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {/* 1. All Products */}
            <Link
              href="/products"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                isProductsActive
                  ? "bg-amber-950 text-amber-50 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-950 hover:bg-stone-100/80"
              }`}
            >
              کاتالوگ آثار
            </Link>

            {/* 2. Bestsellers (Distinct Destination) */}
            <Link
              href="/products?featured=true"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                isBestsellerActive
                  ? "bg-amber-950 text-amber-50 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-950 hover:bg-stone-100/80"
              }`}
            >
              <Flame className="w-4 h-4 text-amber-700" />
              <span>پرفروش‌ترین‌ها</span>
              <Badge variant="gold" className="text-[10px] px-1.5 py-0">ویژه</Badge>
            </Link>

            {/* 3. Categories Mega Dropdown */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                onMouseEnter={() => setCategoryMenuOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-100/80 transition-all flex items-center gap-1"
              >
                <Layers className="w-4 h-4 text-stone-500" />
                <span>دسته‌بندی‌ها</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
              </button>

              {/* Hover Dropdown Card */}
              <div
                onMouseLeave={() => setCategoryMenuOpen(false)}
                className={`absolute top-full right-0 mt-1 w-72 rounded-2xl border border-stone-200/90 bg-white/95 backdrop-blur-md shadow-xl p-2 transition-all duration-200 z-50 ${
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
                    className="flex flex-col p-2.5 rounded-xl hover:bg-amber-50/70 transition-colors group/item"
                  >
                    <span className="text-xs font-bold text-stone-900 group-hover/item:text-amber-950">
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
                    className="text-center block text-xs font-bold text-amber-950 hover:underline py-1"
                  >
                    مشاهده تمامی گروه‌ها ←
                  </Link>
                </div>
              </div>
            </div>

            {/* 4. Bespoke Custom Orders */}
            <Link
              href="/contact"
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 ${
                location === "/contact"
                  ? "bg-amber-950 text-amber-50 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-950 hover:bg-stone-100/80"
              }`}
            >
              <Hammer className="w-3.5 h-3.5 text-amber-800" />
              <span>سفارش اختصاصی</span>
            </Link>

            {/* 5. Journal */}
            <Link
              href="/blog"
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                location.startsWith("/blog")
                  ? "bg-amber-950 text-amber-50 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-950 hover:bg-stone-100/80"
              }`}
            >
              مجله چوب
            </Link>

            {/* 6. About Workshop */}
            <Link
              href="/about"
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                location === "/about"
                  ? "bg-amber-950 text-amber-50 shadow-2xs font-bold"
                  : "text-stone-700 hover:text-stone-950 hover:bg-stone-100/80"
              }`}
            >
              کارگاه ما
            </Link>
          </nav>
        </div>

        {/* Left Section: Search + Cart + Account Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openSearch}
            className="gap-2 border-stone-200/90 text-stone-600 rounded-xl hover:border-amber-900/40"
            aria-label="جستجوی آثار"
          >
            <Search className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline font-medium">جستجو...</span>
            <kbd className="hidden md:inline text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200 font-mono">
              /
            </kbd>
          </Button>

          {/* Cart Trigger Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openCart}
            className="relative gap-2 border-stone-200/90 text-stone-800 rounded-xl hover:border-amber-900/40"
            aria-label={`سبد خرید، ${itemCount} قلم کالا`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-950" />
            <span className="hidden sm:inline font-medium">سبد خرید</span>
            {itemCount > 0 ? (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[11px] font-bold rounded-full bg-amber-950 text-white">
                {itemCount}
              </span>
            ) : null}
          </Button>

          {/* User Account / Auth Button */}
          {user ? (
            <div className="flex items-center gap-1.5">
              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <Button
                    variant="wood"
                    size="sm"
                    className="gap-1.5 hidden sm:inline-flex text-xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>پنل مدیریت</span>
                  </Button>
                </Link>
              )}

              <Link href="/account">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-stone-200/90"
                  aria-label={`حساب کاربری ${user.name}`}
                >
                  <div className="w-5 h-5 rounded-full bg-amber-950 text-amber-100 flex items-center justify-center text-[10px] font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[80px] sm:max-w-[110px] truncate font-medium text-xs">
                    {user.name}
                  </span>
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => openAuth("signin")}
              className="gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>ورود / ثبت‌نام</span>
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE NAVIGATION DRAWER (RTL Slide-In Sheet)                             */}
      {/* ========================================================================= */}
      <Sheet open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} side="right">
        {/* Drawer Header */}
        <SheetHeader onClose={() => setMobileDrawerOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950 text-amber-50 font-bold font-serif text-sm">
              RW
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-stone-900 leading-tight">روت‌وود گروپ</h2>
              <p className="text-[11px] text-amber-900 font-medium">آتلیه مبلمان و نجاری سنتی</p>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* User Account Quick Card inside Drawer */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-950 text-amber-50 flex items-center justify-center font-bold text-sm">
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
                  className="text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/80"
                >
                  حساب کاربری
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-5 h-5 text-amber-900" />
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
                  className="text-xs"
                >
                  ورود / ثبت‌نام
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Links Group */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block px-2 mb-2">
              بخش‌های فروشگاه و آتلیه
            </span>

            {/* Home */}
            <Link
              href="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
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
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-stone-500" />
                <span>کاتالوگ کامل آثار</span>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            {/* Bestsellers (Distinct Destination) */}
            <Link
              href="/products?featured=true"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-amber-950 bg-amber-500/10 border border-amber-900/10 hover:bg-amber-500/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-amber-700" />
                <span>پرفروش‌ترین دست‌سازه‌ها</span>
              </div>
              <Badge variant="gold" className="text-[10px]">پیشنهاد کارگاه</Badge>
            </Link>

            {/* Categories Accordion */}
            <div className="rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between p-3 text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-800" />
                  <span>دسته‌بندی‌های چوبی</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                    categoriesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoriesOpen && (
                <div className="bg-stone-100/70 p-2 space-y-1 rounded-xl mr-3 my-1 border-r-2 border-amber-900/40">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="block p-2 rounded-lg text-xs font-medium text-stone-700 hover:bg-white hover:text-amber-950 transition-colors"
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
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
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
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
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
              className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-100 transition-colors"
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
          <div className="space-y-3 p-4 bg-stone-100/70 rounded-2xl text-xs text-stone-600">
            <div className="flex items-center gap-2 font-bold text-stone-800 text-xs">
              <Phone className="w-3.5 h-3.5 text-amber-900" />
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
        <div className="p-4 border-t border-stone-200/80 bg-white sticky bottom-0">
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
            <span className="bg-amber-800 text-amber-100 text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount} کالا
            </span>
          </Button>
        </div>
      </Sheet>
    </header>
  );
}
