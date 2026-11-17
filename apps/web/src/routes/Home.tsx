import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Hammer,
  Layers,
  Leaf,
  ShieldCheck,
} from "lucide-react";
import { api, type Category, type Product, type BlogPost } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { SectionHeader } from "@/components/section-header";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatJalaliDate, toPersianDigits } from "@/lib/price";
import { Seo } from "@/components/seo";
import { FEATURE_FLAGS } from "@/lib/site-config";

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const promises: Promise<unknown>[] = [
          api.getBlogPosts({ limit: 3 }).catch(() => ({ posts: [] })),
        ];
        if (FEATURE_FLAGS.showProducts) {
          promises.push(
            api.getCategories().catch(() => ({ categories: [] })),
            api.getProducts({ featured: true, limit: 3 }).catch(() => ({ items: [] }))
          );
        }
        const results = await Promise.all(promises);
        const postResponse = results[0] as { posts?: BlogPost[] };
        setRecentPosts(postResponse.posts || []);

        if (FEATURE_FLAGS.showProducts) {
          const categoryResponse = results[1] as { categories?: Category[] };
          const productResponse = results[2] as { items?: Product[] };
          setCategories(categoryResponse?.categories || []);
          setFeaturedProducts(productResponse?.items || []);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      <Seo
        title="روت‌وود | مبلمان دست‌ساز چوب طبیعی"
        description="میز اسلب، نشیمن و دکور دست‌ساز از گردو، بلوط، گیلاس و توت ایرانی؛ ساخته‌شده در آتلیه روت‌وود با اتصالات اصیل نجاری و ارسال به سراسر ایران."
        path="/"
        image="/images/oak-dining-table.webp"
      />
      <Reveal>
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 rounded-[2rem] border border-[var(--color-border)] bg-gradient-to-bl from-white via-[var(--color-canvas)] to-[var(--color-surface-2)] px-6 py-12 sm:px-10 lg:grid-cols-12 lg:py-16">
            <div className="space-y-5 lg:col-span-7">
              <Badge variant="gold" className="gap-1.5 px-3 py-1">
                <Flame className="h-3.5 w-3.5" />
                آتلیه نجاری دست‌ساز از سال ۱۳۹۴
              </Badge>

              <h1 className="font-serif text-3xl font-black leading-[1.2] tracking-tight text-[var(--color-ink)] sm:text-5xl">
                مبلمانی که با روح چوب‌های کهنسال نفس می‌کشد.
              </h1>

              <p className="max-w-xl text-sm font-light leading-relaxed text-[var(--color-ink-soft)] sm:text-base">
                میزهای اسلب، نشیمن ارگونومیک و ظروف خراطی از گردو، بلوط، راش و چنار ایران؛ با
                اتصالات اصیل نجاری و روغن‌های گیاهی برای دهه‌ها ماندگاری.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {FEATURE_FLAGS.showProducts ? (
                  <>
                    <Link href="/products">
                      <Button size="lg" className="gap-2">
                        مشاهدهٔ کاتالوگ
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/products?featured=true">
                      <Button size="lg" variant="outline" className="gap-2">
                        پرفروش‌ترین آثار
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/gallery">
                      <Button size="lg" className="gap-2">
                        مشاهدهٔ گالری آثار
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button size="lg" variant="outline" className="gap-2">
                        <Hammer className="h-4 w-4" />
                        سفارش ساخت اختصاصی
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 border-t border-[var(--color-border)] pt-5 text-xs text-[var(--color-ink-soft)] sm:grid-cols-3">
                {[
                  "چوب ۱۰۰٪ طبیعی بدون ام‌دی‌اف",
                  "اتصالات کام و زبانهٔ دست‌ساز",
                  "گارانتی ۲ سالهٔ اصالت اثر",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <img
                  src="/images/oak-dining-table.webp"
                  alt="میز ناهارخوری بلوط دست‌ساز روت‌وود"
                  width={1200}
                  height={900}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-4 right-4 rounded-xl border border-[var(--color-border)] bg-white/95 px-3 py-2 backdrop-blur">
                  <div className="font-serif text-xs font-bold text-[var(--color-ink)]">
                    میز اسلب بلوط جنگلی
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[var(--color-accent)]">
                    اتصال دم‌چلچله‌ای با فینیش روغن بزرک
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {FEATURE_FLAGS.showProducts && categories.length > 0 && (
        <Reveal>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="مجموعه‌ها"
            title="دسته‌بندی‌های چوب و دکوراسیون"
            action={
              <Link href="/products">
                <Button variant="ghost" size="sm" className="gap-1 text-[var(--color-accent)]">
                  همهٔ دسته‌ها
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            }
            className="mb-6"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-300 hover:border-[var(--color-accent)]/40 hover:shadow-card"
              >
                <div className="space-y-2">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-white">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                    {category.name}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {category.description || "آثار دست‌ساز ساخته‌شده با ظرافت استادکاران کارگاه"}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3 text-[11px] font-bold text-[var(--color-accent)]">
                  <span>
                    {category.productCount
                      ? `${toPersianDigits(category.productCount)} اثر`
                      : "مشاهدهٔ آثار"}
                  </span>
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
        </Reveal>
      )}

      {FEATURE_FLAGS.showProducts && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="شاهکارهای برگزیده"
            title="پرفروش‌ترین آثار کارگاه"
            action={
              <Link href="/products?featured=true">
                <Button variant="outline" size="sm" className="gap-1.5">
                  مشاهدهٔ همه
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            }
            className="mb-6"
          />

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="h-96 animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60"
                />
              ))}
            </div>
          ) : (
            <Reveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </Reveal>
          )}
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="grid grid-cols-1 items-center gap-10 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-7 sm:p-12 lg:grid-cols-12">
          <div className="order-2 overflow-hidden rounded-2xl border border-[var(--color-border)] lg:order-1 lg:col-span-5">
            <img
              src="/images/workshop.webp"
              alt="کارگاه نجاری روت‌وود"
              className="aspect-4/3 w-full object-cover"
            />
          </div>

          <div className="order-1 space-y-5 lg:order-2 lg:col-span-7">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
              فرآیند خلق در کارگاه
            </span>

            <h2 className="font-serif text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              هر تکه چوب، راوی داستانی از دهه‌ها زندگی است.
            </h2>

            <p className="text-xs leading-relaxed text-[var(--color-ink-soft)] sm:text-sm">
              الوارها را بر اساس نقش رگه‌ها و گره‌های طبیعی انتخاب می‌کنیم؛ بدون ام‌دی‌اف و
              لایه‌های پلاستیکی. ابعاد و گونهٔ چوب دلخواه شما در کارگاه ساخته می‌شود.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                <div>
                  <div className="font-serif text-sm font-bold text-[var(--color-ink)]">
                    روغن گیاهی ارگانیک
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--color-ink-soft)]">
                    پوشش بدون مواد شیمیایی فرار، مناسب ظروف غذاخوری.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" />
                <div>
                  <div className="font-serif text-sm font-bold text-[var(--color-ink)]">
                    ضمانت اصالت و سلامت
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--color-ink-soft)]">
                    شناسنامهٔ کتبی چوب و تضمین اتصالات تا دو سال.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/contact">
                <Button className="gap-2">
                  <Hammer className="h-4 w-4" />
                  سفارش ساخت اختصاصی
                </Button>
              </Link>
              <Link
                href="/about"
                className="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
              >
                دربارهٔ کارگاه
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {recentPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="مجلهٔ چوب"
            title="راهنماهای مراقبت و رازهای نجاری"
            action={
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="gap-1 text-[var(--color-accent)]">
                  همهٔ مقالات
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            }
            className="mb-6"
          />

          <Reveal className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-4 transition-all duration-300 hover:border-[var(--color-accent)]/40 hover:shadow-card"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="mb-4 block aspect-16/10 overflow-hidden rounded-xl bg-[var(--color-surface-2)]"
                >
                  <img
                    src={post.coverImage || "/images/workshop.webp"}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-[var(--color-ink-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatJalaliDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {toPersianDigits(post.readingTimeMinutes || 5)} دقیقه
                    </span>
                  </div>

                  <h3 className="line-clamp-2 font-serif text-base font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3 text-[11px] font-bold text-[var(--color-accent)]">
                  <span>مطالعهٔ مقاله</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </article>
            ))}
          </Reveal>
        </section>
      )}
    </div>
  );
}
