import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProducts,
  getRelatedProducts,
  type Product,
} from "@/lib/api";
import { ProductReviews } from "./ProductReviews";
import { AddToCartButton } from "./AddToCartButton";
import { ProductGallery } from "./ProductGallery";
import { WoodSelector } from "./WoodSelector";
import { CartDialogTrigger } from "@/components/cart-dialog-trigger";
import { formatCount, formatPrice } from "@/lib/price";
import { productJsonLd, breadcrumbListJsonLd } from "@/lib/seo/jsonld";
import { Star, Sparkles, Check } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_NAME = "Rootwood Group";

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "محصول پیدا نشد" };
  const title = product.name + " | " + SITE_NAME;
  const description = product.tagline ?? product.description.slice(0, 160);
  const images = (product.images || []).map((img) => img.url);
  return {
    title,
    description,
    alternates: {
      canonical: "/products/" + slug,
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: SITE_NAME,
      title,
      description,
      url: "/products/" + slug,
      images: images.length ? images.map((url) => ({ url, alt: product.name })) : [{ url: "/images/oak-dining-table.webp", alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.length ? images : ["/images/oak-dining-table.webp"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export async function generateStaticParams() {
  const fallbackSlugs = [
    "persian-oak-dining-table",
    "walnut-coffee-table",
    "cherry-writing-desk",
    "oak-dining-chair",
    "walnut-milk-bench",
    "persian-oak-dining-chair",
    "mulberry-bookshelf",
    "oak-dresser",
    "walnut-serve-tray",
    "mulberry-bowl",
  ];
  try {
    const res = await getProducts({ limit: 100 });
    if (res?.items && res.items.length > 0) {
      return res.items.map((p) => ({ slug: p.slug }));
    }
  } catch {}
  return fallbackSlugs.map((slug) => ({ slug }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [product, related] = await Promise.all([
    getProductBySlug(slug).catch(() => null),
    getRelatedProducts(slug).catch(() => []),
  ]);

  if (!product) notFound();
  if (!product.rating) {
    product.rating = { average: 5, count: 0 };
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav
          aria-label="مسیر صفحه"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-xs sm:text-sm text-[var(--color-ink-soft)] shadow-xs"
        >
          <Link
            href="/"
            className="rounded-md px-1.5 py-0.5 transition-colors hover:text-[var(--color-wood)]"
          >
            خانه
          </Link>
          <span aria-hidden className="text-[var(--color-border-strong)]">
            /
          </span>
          <Link
            href="/products"
            className="rounded-md px-1.5 py-0.5 transition-colors hover:text-[var(--color-wood)]"
          >
            محصولات
          </Link>
          <span aria-hidden className="text-[var(--color-border-strong)]">
            /
          </span>
          <span className="font-semibold text-[var(--color-ink)]">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Gallery */}
          <div className="self-start lg:sticky lg:top-[5.5rem]">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Info */}
          <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xs">
            <div className="space-y-3.5">
              <span className="inline-block rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-soft)]">
                {product.category.name}
                {product.woodType ? ` · گونه چوب: ${product.woodType}` : ""}
              </span>

              <h1 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl lg:text-4xl tracking-tight">
                {product.name}
              </h1>

              {product.tagline && (
                <p className="text-base leading-relaxed text-[var(--color-ink-soft)]">
                  {product.tagline}
                </p>
              )}

              {/* Rating */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="img"
                  className="flex items-center gap-0.5"
                  aria-label={`${product.rating.average} از ۵ ستاره`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(product.rating.average)
                          ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                          : "fill-transparent text-[var(--color-border-strong)]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--color-ink-soft)]">
                  {product.rating.average > 0
                    ? `${product.rating.average} از ۵`
                    : "هنوز نظری ثبت نشده"}{" "}
                  <span className="font-semibold text-[var(--color-accent-strong)]">
                    ({formatCount(product.rating.count)} نظر)
                  </span>
                </span>
              </div>

              {/* Price & Stock */}
              <div className="mt-2 flex flex-wrap items-baseline gap-3 border-t border-[var(--color-border)] pt-4">
                <span className="text-3xl font-extrabold text-[var(--color-wood)]">
                  {formatPrice(product.price)}
                </span>
                {product.compareAt && product.compareAt > product.price && (
                  <span className="text-base text-[var(--color-ink-mute)] line-through">
                    {formatPrice(product.compareAt)}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    product.stock > 0
                      ? "border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : "border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 text-[var(--color-error)]"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${
                      product.stock > 0
                        ? "bg-[var(--color-success)]"
                        : "bg-[var(--color-error)]"
                    }`}
                  />
                  {product.stock > 0
                    ? `موجود در کارگاه (${formatCount(product.stock)} عدد)`
                    : "در حال حاضر ناموجود"}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {product.description}
            </p>

            {/* Interactive Wood Species Selector */}
            <div className="mt-6">
              <WoodSelector initialWood={product.woodType ?? undefined} />
            </div>

            {/* Specs Table */}
            <dl className="mt-6 grid grid-cols-1 gap-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs sm:grid-cols-2">
              {product.woodType && (
                <>
                  <div>
                    <dt className="text-[var(--color-ink-mute)]">گونه چوب</dt>
                    <dd className="font-bold text-[var(--color-ink)] mt-0.5">{product.woodType}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-ink-mute)]">پرداخت سطح</dt>
                    <dd className="font-bold text-[var(--color-ink)] mt-0.5">{product.finish ?? "روغن‌موم گیاهی استاندارد"}</dd>
                  </div>
                  {product.dimensions && (
                    <>
                      <div>
                        <dt className="text-[var(--color-ink-mute)]">ابعاد دقیق</dt>
                        <dd className="font-bold text-[var(--color-ink)] mt-0.5">{product.dimensions}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-ink-mute)]">وزن تقریبی</dt>
                        <dd className="font-bold text-[var(--color-ink)] mt-0.5">
                          {product.weightKg
                            ? `${product.weightKg.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوگرم`
                            : "—"}
                        </dd>
                      </div>
                    </>
                  )}
                </>
              )}
              <div>
                <dt className="text-[var(--color-ink-mute)]">شناسه فنی کارگاه</dt>
                <dd className="font-mono text-xs font-semibold text-[var(--color-ink)] mt-0.5" dir="ltr">
                  {product.sku}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-ink-mute)]">وضعیت آماده‌سازی</dt>
                <dd className="font-bold text-[var(--color-ink)] mt-0.5">
                  {product.stock > 0
                    ? "آماده بسته‌بندی و ارسال سریع"
                    : "نیاز به سفارش‌گذاری مجدد"}
                </dd>
              </div>
            </dl>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <AddToCartButton product={product} disabled={product.stock === 0} />
              <CartDialogTrigger className="btn btn-ghost h-11 px-5 text-sm font-semibold">
                مشاهده سبد خرید
              </CartDialogTrigger>
            </div>

            {/* Shipping note */}
            <p className="mt-4 text-xs leading-relaxed text-[var(--color-ink-mute)]">
              ارسال رایگان سراسری برای سفارش‌های بالای{" "}
              <span className="font-semibold text-[var(--color-ink-soft)]">
                {formatPrice(5000000)}
              </span>
              . کلیه قطعات با کارتن ۵ لایه، ضربه‌گیر فومی و بسته‌بندی پالت چوبی ارسال می‌شوند.
            </p>

            {/* Trust Badges */}
            <div className="mt-6 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
              {[
                { label: "گارانتی ۱۲ ماهه", detail: "تعمیر کامل یا تعویض رایگان قطعه" },
                { label: "پرداخت دست‌ساز ارگانیک", detail: "روغن‌موم مات ضدآب و دوست‌دار محیط‌زیست" },
                { label: "چوب‌های منتخب جنگلی", detail: "بلوط کهنسال، گردو، گیلاس و توت ایرانی" },
                { label: "اتصالات کام و زبانه", detail: "بدون میخ و بست‌های ناپایدار صنعتی" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
                >
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <div>
                    <p className="font-bold text-[var(--color-ink)]">{item.label}</p>
                    <p className="mt-0.5 text-[var(--color-ink-soft)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related + Reviews */}
        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          {/* Related */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3 px-1">
              <h2 className="text-lg font-bold text-[var(--color-wood)]">
                محصولات مرتبط کارگاه
              </h2>
              <Link
                href="/products"
                className="text-xs font-semibold text-[var(--color-accent-strong)] hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
            {related.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group block rounded-2xl border border-[var(--color-border)] bg-white p-2.5 transition-all hover:border-[var(--color-accent)] hover:shadow-xs"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-surface-2)]">
                      {(p.images as Array<{ url: string }>)[0] ? (
                        <Image
                          src={(p.images as Array<{ url: string }>)[0].url}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[var(--color-ink-mute)]">
                          <Sparkles className="h-6 w-6 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5 flex flex-col gap-0.5 px-1 pb-1">
                      <p className="truncate text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-wood)]">
                        {p.name}
                      </p>
                      <p className="text-xs font-semibold text-[var(--color-accent-strong)]">
                        {formatPrice((p as Product).price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Reviews */}
          <ProductReviews productId={product.id} productSlug={product.slug} />
        </div>
      </div>

      {/* Mobile Sticky Purchase Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-white/95 p-3.5 backdrop-blur-md shadow-2xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[var(--color-wood)]">{product.name}</p>
            <p className="text-sm font-extrabold text-[var(--color-wood)]">{formatPrice(product.price)}</p>
          </div>
          <div className="shrink-0">
            <AddToCartButton product={product} disabled={product.stock === 0} compact />
          </div>
        </div>
      </div>

      <Script
        id="jsonld-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd({
              name: product.name,
              slug: product.slug,
              images: (product.images || []).map((img) => img.url),
              description: product.description,
              price: product.price,
              sku: product.sku,
              stock: product.stock,
              ratingAverage: product.rating.average,
              ratingCount: product.rating.count,
            })
          ),
        }}
      />
      <Script
        id="jsonld-breadcrumb-product"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbListJsonLd([
              { name: "خانه", url: "/" },
              { name: "محصولات", url: "/products" },
              { name: product.name, url: "/products/" + product.slug },
            ])
          ),
        }}
      />
    </>
  );
}
