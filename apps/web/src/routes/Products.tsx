import React, { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Search, SlidersHorizontal, X, ArrowLeft, ArrowRight } from "lucide-react";
import { api, Category, Product, CatalogFacets } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [facets, setFacets] = useState<CatalogFacets>({ woodTypes: [], priceMin: 0, priceMax: 0 });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [woodType, setWoodType] = useState<string>("");
  const [featured, setFeatured] = useState<boolean | null>(null);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Initialize query params from browser URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search");
    const cat = params.get("category");
    const wood = params.get("woodType");
    const feat = params.get("featured");
    const s = params.get("sort");
    const p = params.get("page");

    if (q) setSearch(q);
    if (cat) setCategory(cat);
    if (wood) setWoodType(wood);
    if (feat === "true") setFeatured(true);
    if (s) setSort(s);
    if (p && Number(p) > 0) setPage(Number(p));
  }, []);

  // Load categories and facets
  useEffect(() => {
    Promise.all([
      api<Category[]>("/catalog/categories").catch(() => []),
      api<CatalogFacets>("/catalog/facets").catch(() => ({ woodTypes: [], priceMin: 0, priceMax: 0 })),
    ]).then(([cats, f]) => {
      setCategories(cats);
      setFacets(f);
    });
  }, []);

  // Fetch products whenever filters or pagination change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (category) q.set("category", category);
      if (woodType) q.set("woodType", woodType);
      if (featured !== null) q.set("featured", String(featured));
      if (sort) q.set("sort", sort);
      q.set("limit", String(pageSize));
      q.set("offset", String((page - 1) * pageSize));

      // Sync browser URL without reloading
      const qs = q.toString();
      window.history.replaceState(null, "", `/products${qs ? `?${qs}` : ""}`);

      const res = await api<{ items: Product[]; total: number }>(`/catalog/products?${qs}`);
      setProducts(res.items || []);
      setTotal(res.total || 0);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, category, woodType, featured, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setWoodType("");
    setFeatured(null);
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || category || woodType || featured !== null || sort !== "newest");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-8 sm:p-12 shadow-2xs">
        <span className="inline-block rounded-full bg-white border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)] mb-2 shadow-2xs">
          کاتالوگ کارگاه روت‌وود
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-wood)] tracking-tight">
          {featured ? "پرفروش‌ترین قطعه‌ها" : "همه محصولات — مجموعه مبلمان دست‌ساز"}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)] mt-2 max-w-xl">
          نمایش {products.length} از {total} اثر دست‌ساز از چوب‌های طبیعی بلوط، گردو، گیلاس و توت با پرداخت ارگانیک گیاهی.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو در محصولات..."
              className="w-full rounded-xl border border-[var(--color-border)] pr-10 pl-3 py-2 text-xs bg-[var(--color-surface-2)] focus:bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs bg-[var(--color-surface-2)] focus:bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Wood Type Dropdown */}
          <div>
            <select
              value={woodType}
              onChange={(e) => {
                setWoodType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs bg-[var(--color-surface-2)] focus:bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
            >
              <option value="">همه گونه‌های چوب</option>
              {facets.woodTypes.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs bg-[var(--color-surface-2)] focus:bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
            >
              <option value="newest">جدیدترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="name">نام (الفبا)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--color-border)] text-xs">
          <span className="text-[var(--color-ink-mute)] font-semibold">فیلتر سریع:</span>
          <button
            type="button"
            onClick={() => {
              setFeatured(featured ? null : true);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full font-bold transition-all ${
              featured
                ? "bg-[var(--color-wood)] text-white"
                : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)] hover:bg-stone-200"
            }`}
          >
            فقط پرفروش‌ها
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(category === c.slug ? "" : c.slug);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                category === c.slug
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)] hover:bg-stone-200"
              }`}
            >
              {c.name}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1 rounded-full font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-1 mr-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>پاک‌کردن فیلترها</span>
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 rounded-3xl bg-[var(--color-surface-2)] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border)] bg-white p-16 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4 text-[var(--color-ink-mute)]">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-wood)]">
            محصولی با این مشخصات پیدا نشد
          </h2>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)] max-w-sm mx-auto">
            می‌توانید فیلترهای اعمال‌شده را بردارید یا واژهٔ دیگری را جستجو نمایید.
          </p>
          <div className="mt-6">
            <button onClick={clearFilters} className="btn btn-primary text-xs font-bold">
              نمایش تمام محصولات
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          aria-label="صفحه‌بندی محصولات"
          className="flex items-center justify-center gap-3 pt-8 border-t border-[var(--color-border)]"
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-ghost text-xs font-bold disabled:opacity-30 flex items-center gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>صفحه قبل</span>
          </button>

          <span className="px-4 py-2 rounded-xl bg-[var(--color-surface-2)] text-xs font-bold text-[var(--color-wood)]">
            صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn btn-ghost text-xs font-bold disabled:opacity-30 flex items-center gap-1.5"
          >
            <span>صفحه بعد</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
