import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Sparkles,
  Hammer,
  ShieldCheck,
  Trees,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpRight,
  Leaf,
  Layers,
} from "lucide-react";
import { api, type Category, type Product, type BlogPost } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatJalaliDate, toPersianDigits } from "@/lib/price";

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes, postRes] = await Promise.all([
          api.getCategories().catch(() => ({ categories: [] })),
          api.getProducts({ featured: true, limit: 6 }).catch(() => ({ items: [] })),
          api.getBlogPosts({ limit: 3 }).catch(() => ({ posts: [] })),
        ]);
        setCategories(catRes.categories || []);
        setFeaturedProducts(prodRes.items || []);
        setRecentPosts(postRes.posts || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-24 pb-24 bg-[#fcfbf9]">
      {/* ========================================================================= */}
      {/* 1. HERO SHOWCASE SECTION                                                  */}
      {/* ========================================================================= */}
      <section className="relative px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-stone-200/90 bg-gradient-to-bl from-amber-50/70 via-[#f9f6f0] to-[#f4eee6] px-6 py-16 sm:px-12 sm:py-20 lg:py-24 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text column - 7 cols */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="wood" className="px-3.5 py-1 text-xs gap-1.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                    <span>آتلیه و کارگاه تخصصی نجاری دست‌ساز</span>
                  </Badge>
                  <span className="text-xs font-semibold text-stone-500">
                    تولید اصیل از سال ۱۳۹۴
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif text-stone-900 tracking-tight leading-[1.18]">
                  مبلمانی که با روح چوب‌های کهنسال نفس می‌کشد.
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-stone-600 max-w-xl font-light">
                  میزهای اسلب، نشیمن ارگونومیک، کتابخانه‌های روستیک و ظروف خراطی از چوب‌های اصیل گردو، بلوط، راش و چنار ایران — پرداخت‌شده با روغن‌های گیاهی ارگانیک برای دهه‌ها ماندگاری.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link href="/products">
                    <Button variant="default" size="lg" className="gap-2.5 shadow-md">
                      <span>مشاهده کاتالوگ آثار</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Link href="/products?featured=true">
                    <Button variant="outline" size="lg" className="gap-2 border-stone-300">
                      <Flame className="w-4 h-4 text-amber-800" />
                      <span>پرفروش‌ترین دست‌سازه‌ها</span>
                    </Button>
                  </Link>
                </div>

                {/* Atelier Trust Bulletpoints */}
                <div className="pt-6 border-t border-stone-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-900 shrink-0" />
                    <span>چوب ۱۰۰٪ طبیعی بدون ام‌دی‌اف</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-900 shrink-0" />
                    <span>اتصالات کام و زبانه دست‌ساز</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-900 shrink-0" />
                    <span>گارانتی ۲ ساله اصالت اثر</span>
                  </div>
                </div>
              </div>

              {/* Hero Image - 5 cols */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-4/3 sm:aspect-5/4 overflow-hidden rounded-3xl shadow-xl border border-stone-300/80 bg-stone-200">
                  <img
                    src="/images/oak-dining-table.webp"
                    alt="میز ناهارخوری بلوط ایرانی دست‌ساز روت‌وود"
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                  {/* Floating Spec Tag on Image */}
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 shadow-md">
                    <div className="text-xs font-bold text-stone-900 font-serif">میز اسلب بلوط جنگلی</div>
                    <div className="text-[11px] text-amber-900 font-semibold mt-0.5">اتصال دم‌چلچله‌ای با فینیش روغن بزرک</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATEGORIES VISUAL SHOWCASE                                            */}
      {/* ========================================================================= */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-widest block">
                مجموعه‌های تخصصی
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
                دسته‌بندی‌های چوب و دکوراسیون
              </h2>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="gap-1 text-[#8c4f27] font-semibold self-start sm:self-auto hover:bg-[#f8ede2]">
                <span>مشاهده تمامی دسته‌ها</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative flex flex-col justify-between p-6 rounded-3xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-card hover:border-[#8c4f27]/40 transition-all duration-300"
              >
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#f8ede2] text-[#8c4f27] flex items-center justify-center font-bold mb-4 group-hover:bg-[#8c4f27] group-hover:text-white transition-colors">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-stone-900 group-hover:text-[#8c4f27] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {cat.description || "آثار دست‌ساز اصیل ساخته‌شده با ظرافت استادکاران کارگاه"}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>
                    {cat.productCount ? `${toPersianDigits(cat.productCount)} اثر فعال` : "مشاهده آثار"}
                  </span>
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. FEATURED & BESTSELLING PIECES                                          */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-widest">
              <Flame className="w-4 h-4 text-amber-700" />
              <span>شاهکارهای برگزیده</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              پرفروش‌ترین آثار کارگاه روت‌وود
            </h2>
          </div>
          <Link href="/products?featured=true">
            <Button variant="outline" size="sm" className="gap-1.5 border-stone-300">
              <span>مشاهده تمام پرفروش‌ها</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-stone-200/60 animate-pulse border border-stone-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. WORKSHOP PHILOSOPHY & CRAFTSMANSHIP JOURNEY                           */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-stone-200/90 bg-gradient-to-br from-[#4a2b19] via-[#5c351f] to-[#3f2415] text-[#fcfaf7] p-8 sm:p-14 lg:p-16 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                <Trees className="w-4 h-4" />
                <span>فرآیند خلق در کارگاه روت‌وود</span>
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold font-serif leading-tight">
                هر تکه چوب، راوی داستانی از دهه‌ها زندگی و باران است.
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed text-stone-300 font-light">
                در آتلیه روت‌وود، ما به جای تولید ماشینی انبوه، تک‌تک الوارهای کهنسال را بر اساس نقش رگه‌ها و گره‌های طبیعی انتخاب می‌کنیم. هیچ‌گونه روکش ام‌دی‌اف یا لایه‌های پلاستیکی استفاده نمی‌شود تا عطر طبیعی گردو و بلوط همیشه در خانه شما جریان داشته باشد.
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5">
                  <Leaf className="w-5 h-5 text-amber-400" />
                  <div className="font-bold text-sm text-stone-100 font-serif">روغن گیاهی ارگانیک</div>
                  <div className="text-[11px] text-stone-400 leading-relaxed">
                    پوشش طبیعی بدون مواد شیمیایی فرار (Zero VOC) مناسب ظروف غذاخوری و اتاق کودک.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <div className="font-bold text-sm text-stone-100 font-serif">ضمانت اصالت و سلامت</div>
                  <div className="text-[11px] text-stone-400 leading-relaxed">
                    صدور شناسنامه کتبی چوب همراه با تضمین عدم تابیدگی اتصالات تا ۲ سال.
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-4/3 overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
                <img
                  src="/images/workshop.webp"
                  alt="کارگاه نجاری و هنر چوب روت‌وود"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BESPOKE COMMISSION CALLOUT BANNER                                      */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-900/20 bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-2 text-center md:text-right">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-widest block">
              سفارش‌های ساخت اختصاصی
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-stone-900">
              آیا ابعاد خاص یا گونه چوب مشخصی برای منزلتان مد نظر دارید؟
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl leading-relaxed">
              استادکاران روت‌وود آماده طراحی سه‌بعدی و ساخت سفارشی میز، کنسول، دراور و اکسسوری متناسب با معماری فضای شما هستند.
            </p>
          </div>

          <Link href="/contact">
            <Button variant="wood" size="lg" className="shrink-0 gap-2 font-bold shadow-md">
              <Hammer className="w-4 h-4 text-amber-400" />
              <span>ثبت سفارش اختصاصی و مشاوره</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. JOURNAL ARTICLES & CARE GUIDES                                        */}
      {/* ========================================================================= */}
      {recentPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-widest block">
                مجله و دانشنامه چوب
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
                راهنماهای مراقبت و رازهای نجاری اصیل
              </h2>
            </div>
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="gap-1 text-[#8c4f27] hover:bg-[#f8ede2] font-semibold">
                <span>مشاهده تمام مقالات</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col justify-between rounded-3xl border border-stone-200/90 bg-white p-5 shadow-2xs hover:shadow-card hover:border-[#8c4f27]/30 transition-all duration-300"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="aspect-16/10 overflow-hidden rounded-2xl bg-stone-100 mb-4 block"
                >
                  <img
                    src={post.coverImage || "/images/workshop.webp"}
                    alt={post.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatJalaliDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {toPersianDigits(post.readingTimeMinutes || 5)} دقیقه
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-serif text-stone-900 group-hover:text-[#8c4f27] transition-colors line-clamp-2 leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#8c4f27]">
                  <span>مطالعه مقاله</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
