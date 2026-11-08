import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Sparkles, Hammer, ShieldCheck, TreePine, Award } from "lucide-react";
import { api, Category, Product, BlogPost } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { formatDate } from "@/lib/price";

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods, posts] = await Promise.all([
          api<Category[]>("/catalog/categories").catch(() => []),
          api<{ items: Product[] }>("/catalog/products?featured=true&limit=6").catch(() => ({ items: [] })),
          api<{ items: BlogPost[] }>("/blog/posts?limit=3").catch(() => ({ items: [] })),
        ]);
        setCategories(cats);
        setFeaturedProducts(prods.items || []);
        setRecentPosts(posts.items || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-6 py-16 sm:px-12 sm:py-24 lg:py-28 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[var(--color-border)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-accent-strong)] shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  کارگاه تخصصی نجاری و مبلمان دست‌ساز
                </span>

                <h1 className="text-3xl font-black text-[var(--color-wood)] sm:text-5xl lg:text-6xl tracking-tight leading-tight">
                  مبلمانی که جای خودش را در خانه باز می‌کند.
                </h1>

                <p className="text-base sm:text-lg leading-relaxed text-[var(--color-ink-soft)] max-w-xl">
                  میز، نشیمن، کتابخانه و دکور از چوب‌های اصیل: بلوط کهنسال، گردوی تیره‌رنگ، گیلاس و توت ایرانی — پرداخت‌شده با دست با روغن گیاهی، ساخته‌شده برای یک عمر زندگی.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link href="/products" className="btn btn-primary px-6 py-3.5 text-sm font-bold shadow-xs">
                    <span>مشاهده محصولات کارگاه</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <Link href="/contact" className="btn btn-ghost px-6 py-3.5 text-sm font-bold bg-white">
                    سفارش ابعاد اختصاصی
                  </Link>
                </div>
              </div>

              {/* Hero Image */}
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-elevated border border-[var(--color-border)]">
                <img
                  src="/images/oak-dining-table.webp"
                  alt="میز ناهارخوری بلوط ایرانی در دکوراسیون داخلی"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Row */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-[var(--color-accent-strong)] uppercase tracking-wider">
                دسته‌بندی‌های کارگاه
              </span>
              <h2 className="text-2xl font-bold text-[var(--color-wood)] mt-1">
                مجموعه کارهای دست‌ساز
              </h2>
            </div>
            <Link href="/products" className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1">
              <span>مشاهده همه</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col p-5 rounded-2xl border border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] hover:shadow-card transition-all"
              >
                <div className="text-base font-bold text-[var(--color-wood)] group-hover:text-[var(--color-accent)]">
                  {cat.name}
                </div>
                <div className="text-xs text-[var(--color-ink-mute)] mt-1 line-clamp-1">
                  {cat.description || "آثار دست‌ساز کارگاه"}
                </div>
                <div className="mt-4 text-[11px] font-bold text-[var(--color-accent-strong)]">
                  {cat.productCount} اثر فعال ←
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Pieces */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[var(--color-accent-strong)] uppercase tracking-wider">
              منتخب کارگاه
            </span>
            <h2 className="text-2xl font-bold text-[var(--color-wood)] mt-1">
              پرفروش‌ترین قطعه‌های دست‌ساز
            </h2>
          </div>
          <Link href="/products?featured=true" className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1">
            <span>تمام پرفروش‌ها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-[var(--color-surface-2)] animate-pulse" />
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

      {/* Workshop Craft Story */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-8 sm:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-[var(--color-accent-strong)] uppercase tracking-wider">
                اصالت متریال و اتصالات سنتی
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-wood)]">
                احترام به بافت زنده چوب، بدون روکش‌های مصنوعی
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                ما باور داریم مبلمان بخشی از زندگی روزمره است که احساس گرما و آرامش را به خانه می‌آورد. به همین دلیل در روت‌وود گروپ از هیچ‌گونه ام‌دی‌اف، روکش ملامینه یا چسب‌های سمی شیمیایی استفاده نمی‌شود.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-white border border-[var(--color-border)]">
                  <TreePine className="w-6 h-6 text-[var(--color-accent)] mb-2" />
                  <div className="font-bold text-xs text-[var(--color-wood)]">چوب‌های پایدار</div>
                  <div className="text-[11px] text-[var(--color-ink-mute)] mt-1">تأمین اصولی از باغات کهنسال</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[var(--color-border)]">
                  <Award className="w-6 h-6 text-[var(--color-accent)] mb-2" />
                  <div className="font-bold text-xs text-[var(--color-wood)]">ضمانت مادام‌العمر</div>
                  <div className="text-[11px] text-[var(--color-ink-mute)] mt-1">استحکام ساختاری و اتصالات</div>
                </div>
              </div>
            </div>

            <div className="aspect-4/3 overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-md">
              <img
                src="/images/workshop.webp"
                alt="کارگاه نجاری روت‌وود گروپ"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      {recentPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-[var(--color-accent-strong)] uppercase tracking-wider">
                مجله کارگاه
              </span>
              <h2 className="text-2xl font-bold text-[var(--color-wood)] mt-1">
                یادداشت‌ها و آموزش‌های مراقبت از چوب
              </h2>
            </div>
            <Link href="/blog" className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1">
              <span>تمام مقالات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <article key={post.id} className="group rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-2xs hover:shadow-card transition-all">
                {post.coverImage && (
                  <div className="aspect-16/10 overflow-hidden rounded-2xl mb-4 bg-[var(--color-surface-2)]">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-mute)] mb-2">
                  <span>{formatDate(post.createdAt)}</span>
                  <span>•</span>
                  <span>{post.tags[0] || "آموزش"}</span>
                </div>
                <h3 className="font-bold text-base text-[var(--color-wood)] group-hover:text-[var(--color-accent)] line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-xs text-[var(--color-ink-soft)] mt-2 line-clamp-2">
                  {post.excerpt}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
