"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import type { Product, Category } from "@/lib/api";
import { Search } from "lucide-react";

interface ProductsClientProps {
  products: Product[];
  total: number;
  categories: Category[];
  woodTypes: string[];
  currentPage: number;
  pageSize: number;
}

type QueryOverride = string | number | boolean | null;

export function ProductsClient({
  products,
  total,
  categories,
  woodTypes,
  currentPage,
  pageSize,
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const cat = searchParams.get("category") ?? undefined;
  const wood = searchParams.get("woodType") ?? undefined;
  const q = searchParams.get("search") ?? undefined;
  const featuredValue = searchParams.get("featured");
  const featured = featuredValue === "true" ? true : featuredValue === "false" ? false : null;
  const sort = searchParams.get("sort") ?? "newest";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildUrl(overrides: Record<string, QueryOverride>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key);
      else params.set(key, String(value));
    });
    const query = params.toString();
    return `/products${query ? `?${query}` : ""}`;
  }

  const queryDesc = [
    q ? `برای «${q}»` : null,
    cat
      ? `در دسته «${categories.find((category) => category.slug === cat)?.name ?? cat}»`
      : null,
    wood ? `از چوب ${wood}` : null,
    featured ? "در بخش پرفروش‌ها" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const pillClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
      active
        ? "bg-[var(--color-wood)] text-white shadow-xs"
        : "bg-white text-[var(--color-ink-soft)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
    }`;

  return (
    <>
      <section className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass-card relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white px-6 py-10 sm:px-12 sm:py-14 shadow-xs">
            <div className="relative max-w-2xl space-y-3">
              <span className="inline-block rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-accent-strong)]">
                کاتالوگ کارگاه
              </span>
              <h1 className="text-3xl font-bold text-[var(--color-wood)] sm:text-4xl lg:text-5xl tracking-tight">
                {featured ? "پرفروش‌ترین قطعه‌ها" : "همه محصولات — مجموعه مبلمان دست‌ساز"}
              </h1>
              <p className="text-base leading-relaxed text-[var(--color-ink-soft)]">
                {products.length > 0 ? (
                  <>
                    نمایش {products.length.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")} قطعه {queryDesc || "در همه محصولات"}. تمام کارها از چوب‌های طبیعی با پوشش محافظ گیاهی ساخته شده‌اند.
                  </>
                ) : (
                  "هیچ قطعه‌ای با فیلترهای انتخابی هم‌خوان نیست — می‌توانید فیلترها را پاک یا تغییر دهید."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="z-20 px-4 pt-4 sm:px-6 lg:sticky lg:top-[4.75rem] lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--color-border)] bg-white/95 px-5 py-4 backdrop-blur-md shadow-xs">
          <form
            key={searchParams.toString()}
            action="/products"
            method="get"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_9rem_9rem_11rem_auto_auto] lg:items-end"
            aria-label="جستجو، قیمت و مرتب‌سازی محصولات"
          >
            {cat && <input type="hidden" name="category" value={cat} />}
            {wood && <input type="hidden" name="woodType" value={wood} />}
            {featuredValue === "true" || featuredValue === "false" ? (
              <input type="hidden" name="featured" value={featuredValue} />
            ) : null}

            <div>
              <label htmlFor="product-search" className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                جستجوی محصول
              </label>
              <input
                id="product-search"
                name="search"
                type="search"
                maxLength={80}
                defaultValue={searchParams.get("search") ?? ""}
                placeholder="نام قطعه یا کاربرد…"
                className="glass-input w-full rounded-xl px-3.5 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label htmlFor="product-min-price" className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                حداقل قیمت (تومان)
              </label>
              <input
                id="product-min-price"
                name="minPrice"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                defaultValue={searchParams.get("minPrice") ?? ""}
                className="glass-input w-full rounded-xl px-3.5 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label htmlFor="product-max-price" className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                حداکثر قیمت (تومان)
              </label>
              <input
                id="product-max-price"
                name="maxPrice"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                defaultValue={searchParams.get("maxPrice") ?? ""}
                className="glass-input w-full rounded-xl px-3.5 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label htmlFor="product-sort" className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                مرتب‌سازی بر اساس
              </label>
              <select
                id="product-sort"
                name="sort"
                defaultValue={sort}
                className="glass-input w-full rounded-xl px-3.5 py-2 text-sm outline-none"
              >
                <option value="newest">جدیدترین ساخته‌ها</option>
                <option value="price-asc">ارزان‌ترین</option>
                <option value="price-desc">گران‌ترین</option>
                <option value="rating">بالاترین امتیاز</option>
                <option value="name">نام محصول (الفبا)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary h-[40px] px-5 text-sm font-semibold">
              اعمال فیلتر
            </button>
            <Link href="/products" className="btn btn-ghost h-[40px] px-4 text-sm font-semibold">
              حذف فیلترها
            </Link>
          </form>

          {/* Quick Filter Pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-[var(--color-border)] pt-3 pb-1 sm:flex-wrap" aria-label="فیلتر دسته‌بندی و نوع چوب">
            <Link
              href={buildUrl({ category: null, woodType: null, featured: null })}
              className={pillClass(!cat && !wood && featured === null)}
              aria-current={!cat && !wood && featured === null ? "page" : undefined}
            >
              همه
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={buildUrl({ category: category.slug, woodType: null, featured: null })}
                className={pillClass(cat === category.slug)}
                aria-current={cat === category.slug ? "page" : undefined}
              >
                {category.name}
                <span className="ms-1.5 text-xs opacity-75">
                  ({category.productCount.toLocaleString("fa-IR")})
                </span>
              </Link>
            ))}
            {woodTypes.length > 0 && (
              <span className="self-center px-1 text-xs font-medium text-[var(--color-ink-mute)]">چوب:</span>
            )}
            {woodTypes.map((woodType) => (
              <Link
                key={woodType}
                href={buildUrl({ category: null, woodType, featured: null })}
                className={pillClass(wood === woodType)}
                aria-current={wood === woodType ? "page" : undefined}
              >
                {woodType}
              </Link>
            ))}
            <Link
              href={buildUrl({ featured: featured ? null : "true", category: null, woodType: null })}
              className={pillClass(featured === true)}
              aria-current={featured === true ? "page" : undefined}
            >
              {featured ? "فقط پرفروش‌ها" : "نمایش پرفروش‌ها"}
            </Link>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-mute)]">
              <Search className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-wood)]">محصولی با این مشخصات پیدا نشد</h2>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              می‌توانید فیلترهای اعمال‌شده را بردارید یا واژهٔ دیگری را جستجو نمایید.
            </p>
            <div className="mt-6">
              <Link href="/products" className="btn btn-primary text-sm">
                نمایش تمام محصولات
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-3 border-t border-[var(--color-border)] pt-8" aria-label="صفحه‌بندی محصولات">
            {currentPage > 1 ? (
              <Link href={buildUrl({ page: currentPage - 1 })} className="btn btn-ghost text-sm" rel="prev">
                صفحه قبل
              </Link>
            ) : (
              <span className="btn btn-ghost cursor-not-allowed text-sm opacity-50" aria-disabled="true">
                صفحه قبل
              </span>
            )}
            <span className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-xs" aria-current="page">
              صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
            </span>
            {currentPage < totalPages ? (
              <Link href={buildUrl({ page: currentPage + 1 })} className="btn btn-ghost text-sm" rel="next">
                صفحه بعد
              </Link>
            ) : (
              <span className="btn btn-ghost cursor-not-allowed text-sm opacity-50" aria-disabled="true">
                صفحه بعد
              </span>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
