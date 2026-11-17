import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Compass,
  Hammer,
  Layers,
  MapPin,
  Maximize2,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trees,
  X,
} from "lucide-react";
import { Seo } from "@/components/seo";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GalleryItem {
  id: string;
  title: string;
  category: "tables" | "seating" | "storage" | "decor";
  categoryLabel: string;
  wood: string;
  dimensions: string;
  finish: string;
  joinery: string;
  location: string;
  year: string;
  image: string;
  detailImage?: string;
  description: string;
  highlights: string[];
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "oak-slab-table",
    title: "میز ناهارخوری اسلب بلوط جنگلی ۸ نفره",
    category: "tables",
    categoryLabel: "میز ناهارخوری",
    wood: "اسلب بلوط جنگلی کهنسال با نقش رگه زنده",
    dimensions: "۲۴۰ × ۱۰۰ سانتی‌متر (ارتفاع ۷۶ سانتی‌متر)",
    finish: "سه دست روغن بزرک ارگانیک نفوذگر و موم زنبور عسل",
    joinery: "اتصالات پروانه‌ای (Butterfly Keys) چوب گردو و کام و زبانه",
    location: "پروژه مسکونی فرمانیه، تهران",
    year: "۱۴۰۳",
    image: "/images/oak-dining-table.webp",
    detailImage: "/images/oak-dining-table-detail.webp",
    description:
      "ساخته‌شده از اسلب یکپارچه بلوط با لبه‌های کاملاً طبیعی (Live Edge). اتصالات پروانه‌ای از جنس گردوی تیره برای تثبیت گره‌های طبیعی چوب به کار رفته تا علاوه بر استحکام ابدی، کنتراست بصری شکوهمندی ایجاد کند.",
    highlights: [
      "حفظ لبه طبیعی چوب (Live Edge)",
      "کلیدهای پروانه‌ای گردو برای دوام ماندگار",
      "پایه‌های چوبی دست‌تراش با اتصالات فارسی دوبل",
    ],
  },
  {
    id: "walnut-coffee-table",
    title: "میز جلو‌مبلی ژورنالی گردوی سیاه",
    category: "tables",
    categoryLabel: "میز جلو‌مبلی",
    wood: "گردوی کهنسال تیره با بافت ابریشمی",
    dimensions: "۱۳۰ × ۷۵ سانتی‌متر (ارتفاع ۴۲ سانتی‌متر)",
    finish: "روغن گیاهی مات اروپایی، ۱۰۰٪ ضد لکه آب و نوشیدنی",
    joinery: "اتصال دم‌چلچله‌ای سرانگشتی (Dovetail Joint)",
    location: "ویلای لواسان، استان تهران",
    year: "۱۴۰۳",
    image: "/images/walnut-coffee-table.webp",
    description:
      "طراحی مینیمال و معاصر با الهام از خطوط نجاری ژاپنی. در این اثر بافت موج‌دار و تیرهٔ گردوی مناطق کوهستانی به شکل یکپارچه در پایه‌ها و صفحه جریان دارد.",
    highlights: [
      "موج رگه‌های قرینه (Bookmatched)",
      "سطح سنباده‌خورده با دست تا گرید ۱۲۰۰",
      "مقاومت در برابر رطوبت و حرارت سطحی",
    ],
  },
  {
    id: "cherry-writing-desk",
    title: "میز تحریر و کار اختصاصی چوب گیلاس",
    category: "tables",
    categoryLabel: "میز کار و تحریر",
    wood: "چوب گیلاس وحشی با تنالیته گرم و پخته",
    dimensions: "۱۵۰ × ۷۰ سانتی‌متر (ارتفاع ۷۵ سانتی‌متر)",
    finish: "روغن طبیعی کتان با پولیش دستی بدون مواد شیمیایی فرار",
    joinery: "اتصالات نیم و نیم تقویت‌شده با پیم‌های چوبی گردو",
    location: "دفتر معماری، نیاوران، تهران",
    year: "۱۴۰۲",
    image: "/images/cherry-writing-desk.webp",
    detailImage: "/images/cherry-writing-desk-detail.webp",
    description:
      "میز کار ارگونومیک همراه با کشوی باریک مخفی بدون دستگیره فلزی. رنگ چوب گیلاس در گذر زمان تیره‌تر و اصیل‌تر می‌شود و با نور محیط جلوه‌ای مخملی به خود می‌گیرد.",
    highlights: [
      "کشوهای چوبی با ریل ساخته‌شده از چوب راش",
      "گوشه‌های ملایم پخ‌خورده با رنده دستی",
      "جایگاه اختصاصی عبور کابل‌های دیجیتال",
    ],
  },
  {
    id: "walnut-bench",
    title: "نیمکت نشیمن اسلب گردو و پایه‌های مخروطی",
    category: "seating",
    categoryLabel: "نشیمن و نیمکت",
    wood: "اسلب تنه گردوی جنگلی با گره‌های زنده",
    dimensions: "۱۶۰ × ۳۸ سانتی‌متر (ارتفاع ۴۵ سانتی‌متر)",
    finish: "فینیش روغنی هاردواکس نیمه‌مات",
    joinery: "اتصال گوه و زبانهٔ نمایان (Wedged Tenon)",
    location: "فضای ورودی اقامتگاه بوم‌گردی، یزد",
    year: "۱۴۰۲",
    image: "/images/walnut-bench.webp",
    description:
      "نیمکتی بسیار مقاوم با تحمل وزن بالا برای ورودی منزل یا پشت میز ناهارخوری. پایه‌ها با اتصالات گوه چوبی محکم شده‌اند که به صورت بصری روی صفحه خودنمایی می‌کنند.",
    highlights: [
      "طراحی پایه‌های مخروطی تراشیده با زاویه ارگونومیک",
      "اتصال گوه‌ای نمایان با کنتراست رنگ چوب",
      "قابلیت چیدمان چندمنظوره",
    ],
  },
  {
    id: "oak-dining-chair",
    title: "صندلی ناهارخوری ارگونومیک تمام بلوط",
    category: "seating",
    categoryLabel: "صندلی ناهارخوری",
    wood: "چوب بلوط فشرده خشک‌کن رفته",
    dimensions: "۵۲ × ۵۰ سانتی‌متر (ارتفاع تکیه‌گاه ۸۲ سانتی‌متر)",
    finish: "روغن ارگانیک گیاهی خودرنگ",
    joinery: "اتصالات کام و زبانه کور (Mortise & Tenon)",
    location: "مجموعه پذیرایی سنتی، شیراز",
    year: "۱۴۰۳",
    image: "/images/oak-dining-chair.webp",
    description:
      "نشیمن این صندلی با تیشه‌های سنتی گود شده تا راحتی کامل نشستن بدون نیاز به تشکچه فراهم شود. تکیه‌گاه چوبی نیز بر اساس انحنای ستون فقرات خم‌کاری و رنده‌کاری شده است.",
    highlights: [
      "کف نشیمن گود شده با دست (Saddled Seat)",
      "تکیه‌گاه قوسی با رنده‌کاری ظریف",
      "اتصالات تقویت‌شده مناسب استفادهٔ مداوم",
    ],
  },
  {
    id: "mulberry-bookshelf",
    title: "کتابخانه دیواری قفسه‌ای از چوب توت و بلوط",
    category: "storage",
    categoryLabel: "کتابخانه و قفسه",
    wood: "طبقات چوب توت زرد کهنسال و بدنه بلوط",
    dimensions: "۱۸۰ × ۲۱۰ سانتی‌متر (عمق ۳۲ سانتی‌متر)",
    finish: "روغن جلا گیاهی مات با حفظ عطر طبیعی چوب",
    joinery: "اتصال فارسی فاق‌دار و بست‌های چوبی دست‌ساز",
    location: "کتابخانه خصوصی، مشهد",
    year: "۱۴۰۲",
    image: "/images/mulberry-bookshelf.webp",
    description:
      "ترکیب رنگ گرم و طلایی چوب توت با وقار خاکستری-قهوه‌ای بلوط. این قفسه بدون هیچ‌گونه پیچ فلزی نمایان ساخته شده و توان نگهداری صدها جلد کتاب سنگین را دارد.",
    highlights: [
      "طبقات ضخیم ۴ سانتی‌متری بدون شکم‌دادگی",
      "اتصالات پنهان با پیچ چوبی اصیل",
      "رنگ‌آمیزی کاملاً خودرنگ با رنگ طبیعی چوب",
    ],
  },
  {
    id: "oak-dresser",
    title: "دراور ۴ کشو با پایه‌های یکپارچه بلوط",
    category: "storage",
    categoryLabel: "دراور و کنسول",
    wood: "بلوط متراکم جنگل‌های شمال",
    dimensions: "۱۱۰ × ۵۰ سانتی‌متر (ارتفاع ۹۵ سانتی‌متر)",
    finish: "پوشش محافظ ارگانیک چندلایه با موم زنبور",
    joinery: "دم‌چلچله سراسری در تمامی کشوها",
    location: "پروژه ویلایی، نمک‌آبرود",
    year: "۱۴۰۱",
    image: "/images/oak-dresser.webp",
    description:
      "طراحی جاودانه که کشوهای آن با اتصالات دستی دم‌چلچله ساخته شده و دستگیره‌ها نیز از همان تکه چوب بدنه تراشیده شده‌اند تا یکپارچگی خطوط قطع نشود.",
    highlights: [
      "دستگیره‌های فرورفته یکپارچه با چوب",
      "کشوهای مقاوم با اتصالات سنتی نجاری",
      "پایه‌های زاویه‌دار با ایستایی پایدار",
    ],
  },
  {
    id: "walnut-serving-tray",
    title: "سینی پذیرایی یکپارچه گردو با دستگیره ارگونومیک",
    category: "decor",
    categoryLabel: "ظروف و اکسسوری",
    wood: "تخته یکپارچه گردوی سیاه",
    dimensions: "۴۵ × ۲۸ سانتی‌متر",
    finish: "روغن دانمارکی کاملاً بهداشتی (Food Safe)",
    joinery: "خراطی و تراش یکپارچه از یک قطعه چوب (بدون چسب)",
    location: "مجموعه ظروف سفارشی آتلیه",
    year: "۱۴۰۳",
    image: "/images/walnut-serving-tray.webp",
    description:
      "تراشیده شده از یک تکه چوب یکدست و بدون هیچ‌گونه اتصال چسبی. سطح آن با روغن‌های ارگانیک خوراکی آماده‌سازی شده تا کاملاً برای سرو نان، پنیر و نوشیدنی ایمن باشد.",
    highlights: [
      "یکپارچه و بدون چسب و درز",
      "پوشش Food-Safe مجاز برای مواد غذایی",
      "مقاومت در برابر شست‌وشوی ملایم دستی",
    ],
  },
  {
    id: "mulberry-bowl",
    title: "کاسه خراطی دست‌ساز از ریشه چوب توت",
    category: "decor",
    categoryLabel: "ظروف و اکسسوری",
    wood: "گره ریشه توت با رگه‌های موج‌دار کهربایی",
    dimensions: "قطر ۲۶ سانتی‌متر (ارتفاع ۱۰ سانتی‌متر)",
    finish: "روغن گردوی طبیعی و موم عسل",
    joinery: "خراطی کاسه‌ای دقیق با مغارهای دستی سنتی",
    location: "کلکسیون آثار دکوراتیو آتلیه",
    year: "۱۴۰۳",
    image: "/images/mulberry-bowl.webp",
    description:
      "این کاسه از چوب ریشهٔ درختی با قدمت بیش از ۶۰ سال خراطی شده است. بافت چشم‌نواز و گره‌های مواج آن همانند یک تابلوی نقاشی طبیعی، شکوه بافت چوب ایرانی را به نمایش می‌گذارد.",
    highlights: [
      "نقوش تصادفی و تکرارنشدنی ریشه درخت",
      "لبه‌های پرداخت‌شده با دست و حس لمس مخملی",
      "امضای حکاکی‌شدهٔ آتلیه در زیر اثر",
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "همه آثار" },
  { id: "tables", label: "میزهای اسلب و ناهارخوری" },
  { id: "seating", label: "نشیمن و نیمکت" },
  { id: "storage", label: "کتابخانه و دراور" },
  { id: "decor", label: "ظروف و دکوری خراطی" },
] as const;

export function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [viewDetailImage, setViewDetailImage] = useState(false);

  const filteredItems =
    selectedCategory === "all"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === selectedCategory);

  const openModal = (item: GalleryItem) => {
    setActiveItem(item);
    setViewDetailImage(false);
  };

  const closeModal = () => {
    setActiveItem(null);
    setViewDetailImage(false);
  };

  useEffect(() => {
    if (activeItem) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeModal();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [activeItem]);

  return (
    <div className="space-y-10 sm:space-y-16 pb-16 sm:pb-24">
      <Seo
        title="گالری آثار اجراشده | روت‌وود"
        description="مشاهده گالری آثار، میزهای اسلب، نشیمن‌ها و پروژه‌های اختصاصی اجرا شده توسط آتلیه نجاری دست‌ساز روت‌وود با اتصالات اصیل و چوب طبیعی."
        path="/gallery"
        image="/images/oak-dining-table.webp"
      />

      {/* Hero Section */}
      <section className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-[var(--color-border)] bg-gradient-to-bl from-white via-[var(--color-canvas)] to-[var(--color-surface-2)] px-4 py-8 text-center sm:px-12 sm:py-16">
              <Badge variant="gold" className="mx-auto mb-3 sm:mb-4 gap-1.5 px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                آثار خلق‌شده و پروژه‌های اختصاصی
              </Badge>

              <h1 className="font-serif text-2xl font-black leading-tight tracking-tight text-[var(--color-ink)] sm:text-5xl">
                گالری آثار آتلیه روت‌وود
              </h1>

              <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-xs sm:text-base font-light leading-relaxed text-[var(--color-ink-soft)]">
                هر تکه چوب پیشینه‌ای از دهه‌ها زندگی در جنگل‌های ایران را در خود دارد.
                در این گالری گزیده‌ای از آثار اسلب، نشیمن‌ها و پروژه‌های سفارشی که با
                اتصالات اصیل نجاری و پرداخت ارگانیک خلق شده‌اند را مشاهده می‌فرمایید.
              </p>

              {/* Value stats */}
              <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-6 border-t border-[var(--color-border)] pt-6 sm:pt-8">
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white/70 p-2.5 text-center sm:border-0 sm:bg-transparent sm:p-0 space-y-1">
                  <div className="font-serif text-lg sm:text-2xl font-black text-[var(--color-accent)]">
                    ۱۰۰٪
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-[var(--color-ink-soft)]">
                    چوب طبیعی بدون ام‌دی‌اف
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white/70 p-2.5 text-center sm:border-0 sm:bg-transparent sm:p-0 space-y-1">
                  <div className="font-serif text-lg sm:text-2xl font-black text-[var(--color-accent)]">
                    دست‌ساز
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-[var(--color-ink-soft)]">
                    اتصالات اصیل کام و زبانه
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white/70 p-2.5 text-center sm:border-0 sm:bg-transparent sm:p-0 space-y-1">
                  <div className="font-serif text-lg sm:text-2xl font-black text-[var(--color-accent)]">
                    ارگانیک
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-[var(--color-ink-soft)]">
                    روغن‌های گیاهی و موم عسل
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white/70 p-2.5 text-center sm:border-0 sm:bg-transparent sm:p-0 space-y-1">
                  <div className="font-serif text-lg sm:text-2xl font-black text-[var(--color-accent)]">
                    شناسنامه‌دار
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-[var(--color-ink-soft)]">
                    ضمانت کتبی اصالت اثر
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gallery Filter & Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category Tabs (Mobile First Horizontal Scrolling Chips / Centered Desktop) */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all touch-manipulation ${
                    isActive
                      ? "bg-[var(--color-accent)] text-white shadow-xs"
                      : "border border-[var(--color-border)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid */}
        <Reveal className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--color-border)] bg-white shadow-2xs transition-all duration-300 hover:border-[var(--color-accent)]/40 hover:shadow-card"
            >
              {/* Image Container */}
              <div
                className="relative aspect-4/3 cursor-pointer overflow-hidden bg-[var(--color-surface-2)]"
                onClick={() => openModal(item)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Badges on image */}
                <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-wrap gap-1.5">
                  <span className="rounded-lg bg-black/60 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] font-bold text-white backdrop-blur-md">
                    {item.categoryLabel}
                  </span>
                  <span className="rounded-lg bg-[var(--color-accent)]/90 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] font-bold text-white backdrop-blur-md">
                    {item.year}
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between opacity-90 sm:opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-white bg-black/40 sm:bg-transparent px-2 py-1 rounded-lg backdrop-blur-xs">
                    <Maximize2 className="h-3.5 w-3.5" />
                    مشاهده مشخصات و جزئیات
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-accent)]">
                    <Trees className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.wood}</span>
                  </div>

                  <h3
                    className="cursor-pointer font-serif text-sm sm:text-base font-bold leading-snug text-[var(--color-ink)] transition hover:text-[var(--color-accent)]"
                    onClick={() => openModal(item)}
                  >
                    {item.title}
                  </h3>

                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {item.description}
                  </p>

                  <div className="space-y-1.5 border-t border-[var(--color-border-subtle)] pt-2.5 sm:pt-3 text-[11px] text-[var(--color-ink-soft)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-ink-muted)]">ابعاد اثر:</span>
                      <span className="font-mono font-medium">{item.dimensions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-ink-muted)]">محل اجرا:</span>
                      <span className="font-medium">{item.location}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 sm:mt-5 flex items-center gap-2 border-t border-[var(--color-border-subtle)] pt-3 sm:pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-10 sm:h-9 touch-manipulation"
                    onClick={() => openModal(item)}
                  >
                    مشاهده مشخصات
                  </Button>
                  <Link
                    href={`/contact?work=${encodeURIComponent(item.title)}`}
                    className="inline-flex"
                  >
                    <Button size="sm" className="gap-1 px-3 text-xs h-10 sm:h-9 touch-manipulation">
                      سفارش مشابه
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </Reveal>
      </section>

      {/* Lightbox / Details Modal (Portaled to document.body for desktop & mobile fix) */}
      {activeItem && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center p-0 sm:p-4 md:p-6 animate-modal-backdrop"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-dialog-title"
          >
            <div
              className="relative flex flex-col w-full max-h-[92vh] sm:max-h-[88vh] max-w-3xl rounded-t-[1.75rem] sm:rounded-3xl bg-white shadow-2xl border-t sm:border border-[var(--color-border)] overflow-hidden animate-modal-mobile-sheet sm:animate-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag handle */}
              <div className="mx-auto mt-2.5 mb-1 h-1.5 w-12 rounded-full bg-stone-300 sm:hidden shrink-0" />

              {/* Fixed Modal Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 sm:px-6 sm:py-4 bg-white/95 backdrop-blur-md shrink-0 z-10">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <Badge variant="gold" className="text-[11px] font-bold">
                    {activeItem.categoryLabel}
                  </Badge>
                  <span className="text-[11px] sm:text-xs text-[var(--color-ink-muted)]">
                    {activeItem.location} · {activeItem.year}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-9 w-9 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-stone-100 text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] focus:outline-hidden touch-manipulation"
                  aria-label="بستن پنجره"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                {/* Image Preview & Switcher */}
                <div className="relative aspect-4/3 sm:aspect-16/10 overflow-hidden rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <img
                    src={
                      viewDetailImage && activeItem.detailImage
                        ? activeItem.detailImage
                        : activeItem.image
                    }
                    alt={activeItem.title}
                    className="h-full w-full object-cover transition-all duration-500"
                  />

                  {activeItem.detailImage && (
                    <div className="absolute bottom-2.5 right-2.5 left-2.5 sm:left-auto flex items-center justify-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-xl">
                      <button
                        type="button"
                        onClick={() => setViewDetailImage(false)}
                        className={`flex-1 sm:flex-initial rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition shadow-xs touch-manipulation ${
                          !viewDetailImage
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-white/80 text-[var(--color-ink)] hover:bg-white"
                        }`}
                      >
                        نمای کلی اثر
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewDetailImage(true)}
                        className={`flex-1 sm:flex-initial rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition shadow-xs touch-manipulation ${
                          viewDetailImage
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-white/80 text-[var(--color-ink)] hover:bg-white"
                        }`}
                      >
                        نمای بافت و اتصالات
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h2
                    id="gallery-dialog-title"
                    className="font-serif text-lg sm:text-2xl font-black text-[var(--color-ink)] leading-snug"
                  >
                    {activeItem.title}
                  </h2>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {activeItem.description}
                </p>

                {/* Specs Table - 2 columns mobile & desktop */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-3 sm:p-4 text-xs">
                  <div className="flex items-start gap-2">
                    <Trees className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold text-[var(--color-ink-muted)]">گونه چوب:</span>
                      <span className="font-bold text-[var(--color-ink)] text-xs sm:text-sm">{activeItem.wood}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold text-[var(--color-ink-muted)]">ابعاد اثر:</span>
                      <span className="font-mono font-bold text-[var(--color-ink)] text-xs sm:text-sm">
                        {activeItem.dimensions}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold text-[var(--color-ink-muted)]">نوع پوشش (فینیش):</span>
                      <span className="font-bold text-[var(--color-ink)] text-xs sm:text-sm">{activeItem.finish}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Hammer className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold text-[var(--color-ink-muted)]">شیوهٔ اتصالات:</span>
                      <span className="font-bold text-[var(--color-ink)] text-xs sm:text-sm">{activeItem.joinery}</span>
                    </div>
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--color-ink)]">ویژگی‌های برجستهٔ اثر:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {activeItem.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white p-2.5 text-[11px] sm:text-xs font-medium text-[var(--color-ink-soft)]"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="border-t border-[var(--color-border)] px-4 py-3 sm:px-6 sm:py-4 bg-[var(--color-surface-2)]/90 backdrop-blur-md shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-[11px] sm:text-xs text-[var(--color-ink-muted)] text-center sm:text-right">
                    امکان ساخت این اثر با ابعاد سفارشی و چوب دلخواه شما وجود دارد.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={closeModal} className="hidden sm:inline-flex text-xs">
                      بستن
                    </Button>
                    <Link
                      href={`/contact?work=${encodeURIComponent(activeItem.title)}`}
                      className="w-full sm:w-auto"
                      onClick={closeModal}
                    >
                      <Button size="sm" className="w-full sm:w-auto gap-2 h-11 sm:h-9 text-xs sm:text-sm font-bold touch-manipulation">
                        <Hammer className="h-4 w-4" />
                        سفارش اثر مشابه با ابعاد شما
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Bottom CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 rounded-2xl sm:rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 sm:p-12 lg:grid-cols-12">
            <div className="space-y-3 sm:space-y-4 lg:col-span-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
                سفارش ساخت سفارشی
              </span>
              <h2 className="font-serif text-xl font-black text-[var(--color-ink)] sm:text-3xl">
                اثری منحصربه‌فرد برای معماری و فضای اختصاصی شما
              </h2>
              <p className="text-xs leading-relaxed text-[var(--color-ink-soft)] sm:text-sm">
                اگر ابعاد خاص، گونهٔ چوب مشخص (گردو، بلوط، گیلاس، چنار یا افرا) یا طرحی در ذهن
                دارید، در کارگاه روت‌وود آماده‌ایم تا ایده شما را به یک اثر هنری جاودانه تبدیل کنیم.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 sm:w-auto h-11 sm:h-12 text-xs sm:text-sm font-bold">
                  <Hammer className="h-4 w-4" />
                  درخواست مشاوره و سفارش پروژه
                </Button>
              </Link>
              <Link
                href="/about"
                className="text-center sm:text-right text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
              >
                آشنایی با فلسفه نجاری روت‌وود ←
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
