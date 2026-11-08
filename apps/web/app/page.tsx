import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { ArrowLeft, ShoppingBag, Rss, Sparkles, ShieldCheck, Truck, Hammer, Award } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getBlogPosts, getCategories, getProducts } from "@/lib/api";
import { formatCount, formatPrice } from "@/lib/price";
import { organizationJsonLd, websiteJsonLd, breadcrumbListJsonLd } from "@/lib/seo/jsonld";

const SITE_NAME = "Rootwood Group (کرفتدرات)";
const description =
  "مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی. میز، نشیمن، ذخیره‌سازی و دکور برای زندگی روزمره.";

const socialImage = "/images/oak-dining-table.webp";

export const metadata: Metadata = {
  title: "Rootwood Group · کرفتدرات — مبلمان چوبی دست‌ساز",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE_NAME,
    title: SITE_NAME + " — مبلمان چوبی دست‌ساز",
    description,
    url: "/",
    images: [{ url: socialImage, alt: "دوخته چوبی دست‌ساز روت‌وود گروپ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME + " — مبلمان چوبی دست‌ساز",
    description,
    images: [socialImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const FALLBACK_COVER = "/images/workshop.webp";

export default async function HomePage() {
  const [products, categories, blog] = await Promise.all([
    getProducts({ limit: 24, sort: "newest" }).catch(() => ({
      items: [],
      total: 0,
      limit: 24,
      offset: 0,
      hasMore: false,
    })),
    getCategories().catch(() => []),
    getBlogPosts({ page: 1 }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasMore: false,
    })),
  ]);

  const featured = products.items.filter((p) => p.featured).slice(0, 4);
  const journal = blog.items.slice(0, 3);
  const startingPrice = products.items.length
    ? Math.min(...products.items.map((product) => product.price))
    : null;

  return (
    <>
      {/* Hero Section */}
      <section className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass-card relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white px-5 py-8 sm:px-12 sm:py-16 lg:px-16 lg:py-20 shadow-[0_2px_12px_rgba(26,22,19,0.03)]">
            <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-5 sm:space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent-strong)]">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>کارگاه تخصصی نجاری و مبلمان دست‌ساز</span>
                </div>

                <h1 className="text-3xl font-bold leading-[1.35] text-[var(--color-wood)] sm:text-5xl lg:text-6xl tracking-tight">
                  مبلمانی که جای خودش را در خانه باز می‌کند.
                </h1>

                <p className="max-w-lg text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
                  میز، نشیمن، کتابخانه و دکور از چوب‌های اصیل: بلوط کهنسال، گردوی تیره‌رنگ،
                  گیلاس و توت ایرانی — پرداخت‌شده با دست با روغن گیاهی، ساخته‌شده برای یک عمر زندگی.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <Link href="/products" className="btn btn-primary px-6 py-3 text-base">
                    مشاهده مجموعه
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                  <Link href="/about" className="btn btn-ghost px-5 py-3 text-base">
                    فلسفه کارگاه ما
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-3 text-xs text-[var(--color-ink-soft)]">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 font-medium">
                    <Truck className="h-4 w-4 text-[var(--color-accent)]" />
                    ارسال رایگان بالای ۵ میلیون تومان
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 font-medium">
                    <Hammer className="h-4 w-4 text-[var(--color-accent)]" />
                    اتصالات اصیل کام و زبانه
                  </span>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#eee7dd]">
                    <Image
                      src="/images/oak-dining-table.webp"
                      alt="میز غذاخوری بلوط ایرانی کارگاه کرفتدرات"
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/90 px-4 py-2.5 text-xs text-[var(--color-ink)] backdrop-blur-md shadow-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                        بلوط کهنسال کوهستانی با روغن‌موم طبیعی
                      </span>
                      {startingPrice !== null && (
                        <span className="font-bold text-[var(--color-wood)]">
                          قیمت‌ها از {formatPrice(startingPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
            <div>
              <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                منتخب کارگاه
              </span>
              <h2 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
                قطعه‌های پرفروش
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                دست‌سازه‌هایی که بیشترین انتخاب و رضایت همراهان ما را داشته‌اند.
              </p>
            </div>
            <Link
              href="/products?featured=true"
              className="btn btn-ghost text-sm"
            >
              دیدن همه پرفروش‌ها <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* Categories / Spaces */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              دسته‌بندی‌های تخصصی
            </span>
            <h2 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
              خرید بر اساس فضای خانه
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              هر قطعه برای گوشه‌ای معین از زندگی روزمره طراحی شده است.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group glass-card card-lift flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-mute)]">
                    {formatCount(cat.productCount)} قطعه
                  </span>
                  <ArrowLeft className="h-4 w-4 text-[var(--color-accent)] opacity-60 transition-transform group-hover:-translate-x-1 group-hover:opacity-100" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--color-wood)] group-hover:text-[var(--color-accent)] transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {cat.description ?? ""}
                </p>
                <div className="mt-5 border-t border-[var(--color-border)] pt-3 text-xs font-semibold text-[var(--color-accent-strong)]">
                  مشاهده تمام محصولات این دسته ←
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Journal / Blog */}
      {journal.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
            <div>
              <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                دانش و تجربه کارگاه
              </span>
              <h2 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
                از مجله کارگاه
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                یادداشت‌هایی کاربردی درباره مراقبت از چوب، شناخت رگه‌ها و چیدمان پایدار.
              </p>
            </div>
            <Link href="/blog" className="btn btn-ghost text-sm">
              همه مقالات <Rss className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {journal.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group glass-card card-lift flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition-all"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-surface-2)]">
                  <Image
                    src={post.coverUrl ?? FALLBACK_COVER}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="line-clamp-2 text-base font-bold text-[var(--color-wood)] transition-colors group-hover:text-[var(--color-accent)]">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs font-semibold text-[var(--color-accent-strong)]">
                    <span>مطالعه یادداشت</span>
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trust Strip */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--color-border)] bg-white px-6 py-8 shadow-xs">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Hammer,
                title: "مستقیم از دستان نجار",
                desc: "بدون واسطه و تولید سفارشی با نظارت سازنده",
              },
              {
                icon: Truck,
                title: "بسته‌بندی ضربه‌گیر تخصصی",
                desc: "ارسال امن و تضمین سلامت تا داخل منزل",
              },
              {
                icon: Award,
                title: "چوب‌های ۱۰۰٪ طبیعی",
                desc: "بلوط، گردو، گیلاس و توت بدون روکش و نئوپان",
              },
              {
                icon: ShieldCheck,
                title: "ضمانت مادام‌العمر اتصالات",
                desc: "استحکام کام و زبانه با بالاترین استانداردهای نجاری",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-2)] text-[var(--color-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-wood)]">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Script
        id="jsonld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <Script
        id="jsonld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <Script
        id="jsonld-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd([{ name: "خانه", url: "/" }])) }}
      />
    </>
  );
}
