import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
  Trees,
  X,
} from "lucide-react";
import { api, type Category, type Product, type CatalogFacets } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { toPersianDigits } from "@/lib/price";
import { Seo } from "@/components/seo";

const PAGE_SIZE = 12;

const WOOD_SWATCHES: Record<string, string> = {
  گردو: "#3b2216",
  "گردوی سیاه": "#3b2216",
  "گردوی تیره": "#321d13",
  بلوط: "#c49a6c",
  "بلوط جنگلی": "#b88a59",
  "بلوط ایرانی": "#a67c52",
  راش: "#d9b38c",
  "راش گرجستان": "#cf9e70",
  چنار: "#b58763",
  گیلاس: "#8c4331",
  "گیلاس آمریکایی": "#8c4331",
  توت: "#9e6938",
  "توت ایرانی": "#9e6938",
};

const PRICE_RANGES = [
  { id: "all", label: "تمام قیمت‌ها" },
  { id: "under-5m", label: "کمتر از ۵ میلیون تومان" },
  { id: "5m-15m", label: "۵ تا ۱۵ میلیون تومان" },
  { id: "above-15m", label: "بیش از ۱۵ میلیون تومان" },
];

interface Filters {
  search: string;
  category: string;
  woodType: string;
  featured: boolean;
  priceRange: string;
  sort: string;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  category: "",
  woodType: "",
  featured: false,
  priceRange: "all",
  sort: "newest",
};

function readFilters(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get("search") || "",
    category: params.get("category") || "",
    woodType: params.get("woodType") || "",
    featured: params.get("featured") === "true",
    priceRange: params.get("priceRange") || "all",
    sort: params.get("sort") || "newest",
  };
}

function readPage(): number {
  const params = new URLSearchParams(window.location.search);
  return Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
}

function getSwatchColor(wood: string) {
  for (const [key, color] of Object.entries(WOOD_SWATCHES)) {
    if (wood.includes(key)) return color;
  }
  return "#8c6239";
}

function buildQuery(filters: Filters, page: number) {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.category) query.set("category", filters.category);
  if (filters.woodType) query.set("woodType", filters.woodType);
  if (filters.featured) query.set("featured", "true");
  if (filters.priceRange !== "all") query.set("priceRange", filters.priceRange);
  if (filters.sort !== "newest") query.set("sort", filters.sort);
  if (page > 1) query.set("page", String(page));
  return query.toString();
}

function buildParams(filters: Filters, page: number) {
  const params: Record<string, string | number> = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.woodType) params.woodType = filters.woodType;
  if (filters.featured) params.featured = "true";
  if (filters.sort) params.sort = filters.sort;

  if (filters.priceRange === "under-5m") {
    params.maxPrice = 5_000_000;
  } else if (filters.priceRange === "5m-15m") {
    params.minPrice = 5_000_000;
    params.maxPrice = 15_000_000;
  } else if (filters.priceRange === "above-15m") {
    params.minPrice = 15_000_000;
  }

  return params;
}

function pageWindow(current: number, total: number) {
  const size = Math.min(7, total);
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [facets, setFacets] = useState<CatalogFacets>({ woodTypes: [], priceMin: 0, priceMax: 0 });
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(() => readFilters().search);
  const [filters, setFilters] = useState<Filters>(() => readFilters());
  const [page, setPage] = useState(() => readPage());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const firstRender = useRef(true);

  useEffect(() => {
    Promise.all([
      api.getCategories().catch(() => ({ categories: [] })),
      api.getFacets().catch(() => ({ woodTypes: [], priceMin: 0, priceMax: 0 })),
    ]).then(([categoryResponse, facetResponse]) => {
      setCategories(categoryResponse.categories || []);
      setFacets(facetResponse || { woodTypes: [], priceMin: 0, priceMax: 0 });
    });
  }, []);

  // Debounce the search box before it becomes a real filter.
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === filters.search) return;

    const timer = setTimeout(() => {
      setFilters((current) => ({ ...current, search: trimmed }));
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  // Keep the address bar in sync without pushing history entries.
  useEffect(() => {
    const query = buildQuery(filters, page);
    const nextUrl = `/products${query ? `?${query}` : ""}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, page]);

  useEffect(() => {
    const syncFromUrl = () => {
      const nextFilters = readFilters();
      setFilters(nextFilters);
      setSearchInput(nextFilters.search);
      setPage(readPage());
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const response = await api.getProducts(buildParams(filters, page), {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setProducts(response.items || []);
        setTotal(response.total || 0);

        const lastPage = Math.max(1, Math.ceil((response.total || 0) / PAGE_SIZE));
        if (page > lastPage) setPage(lastPage);
      } catch {
        if (!controller.signal.aborted) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [filters, page]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }, []);

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.woodType) count++;
    if (filters.featured) count++;
    if (filters.priceRange !== "all") count++;
    return count;
  }, [filters]);

  const selectedCategoryName =
    categories.find((category) => category.slug === filters.category)?.name || "";

  const priceRangeLabel =
    PRICE_RANGES.find((range) => range.id === filters.priceRange)?.label || "";

  const isEmpty = !loading && products.length === 0;

  const filterControls = (
    <>
      <div className="space-y-3">
        <label className="block text-xs font-bold text-[var(--color-ink)]">دسته‌بندی</label>
        <div className="space-y-2.5">
          <Checkbox
            checked={filters.category === ""}
            onCheckedChange={() => updateFilter("category", "")}
            label="همهٔ دسته‌بندی‌ها"
          />
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <Checkbox
                checked={filters.category === category.slug}
                onCheckedChange={() =>
                  updateFilter(
                    "category",
                    filters.category === category.slug ? "" : category.slug
                  )
                }
                label={category.name}
              />
              {category.productCount !== undefined && (
                <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                  {toPersianDigits(category.productCount)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <label className="block text-xs font-bold text-[var(--color-ink)]">گونهٔ چوب</label>
        <div className="flex flex-wrap gap-2">
          {facets.woodTypes.map((wood) => {
            const selected = filters.woodType === wood;
            return (
              <Chip
                key={wood}
                selected={selected}
                size="sm"
                dotColor={getSwatchColor(wood)}
                onClick={() => updateFilter("woodType", selected ? "" : wood)}
              >
                {wood}
              </Chip>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <label className="block text-xs font-bold text-[var(--color-ink)]">بودجه</label>
        <div className="flex flex-col gap-1.5">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => updateFilter("priceRange", range.id)}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-right text-xs font-medium transition-colors ${
                filters.priceRange === range.id
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)]"
              }`}
            >
              <span>{range.label}</span>
              {filters.priceRange === range.id && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-[85vh] pb-20">
      <Seo
        title={
          filters.featured
            ? "پرفروش‌ترین دست‌سازه‌های چوبی"
            : filters.category
              ? `مجموعهٔ ${selectedCategoryName}`
              : filters.search
                ? `جستجو برای ${filters.search}`
                : "کاتالوگ دست‌سازه‌های چوب طبیعی"
        }
        description={
          selectedCategoryName
            ? `خرید ${selectedCategoryName} دست‌ساز از چوب طبیعی؛ قیمت، ابعاد و شناسنامهٔ اصالت در کاتالوگ روت‌وود.`
            : "کاتالوگ کامل میز، نشیمن، کتابخانه و دکور چوب طبیعی؛ ساخته‌شده در آتلیه روت‌وود با ارسال به سراسر ایران."
        }
        path="/products"
        noindex={Boolean(
          filters.search ||
            filters.category ||
            filters.woodType ||
            filters.featured ||
            filters.priceRange !== "all" ||
            page > 1
        )}
      />
      <div className="border-b border-[var(--color-border)] bg-gradient-to-b from-[var(--color-surface-2)]/60 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <h1 className="max-w-3xl font-serif text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
            {filters.featured
              ? "پرفروش‌ترین دست‌سازه‌های چوبی"
              : filters.category
                ? `مجموعهٔ ${selectedCategoryName}`
                : "کاتالوگ دست‌سازه‌های چوب طبیعی"}
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--color-ink-soft)] sm:text-sm">
            آثار ساخته‌شده از گردو، بلوط، راش و چنار با اتصالات اصیل نجاری و فینیش روغن گیاهی.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-3.5 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="جستجوی نام اثر یا گونهٔ چوب..."
              className="bg-[var(--color-canvas)] pr-10 pl-8"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateFilter("search", "");
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                aria-label="پاک کردن جستجو"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant={filters.featured ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("featured", !filters.featured)}
              className="gap-1.5"
            >
              <Flame className="h-3.5 w-3.5" />
              پرفروش‌ها
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(true)}
              className="gap-2 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 text-[var(--color-accent)]" />
              فیلترها
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
                  {toPersianDigits(activeFiltersCount)}
                </span>
              )}
            </Button>

            <Select
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
              className="h-9 w-44 bg-[var(--color-canvas)] text-xs font-semibold"
            >
              <option value="newest">جدیدترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="name">بر اساس نام</option>
            </Select>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] p-3 text-xs">
            <span className="flex shrink-0 items-center gap-1.5 font-semibold text-[var(--color-accent)]">
              <Tag className="h-3.5 w-3.5" />
              فیلترهای فعال
            </span>

            {filters.category && (
              <Chip selected size="sm" onRemove={() => updateFilter("category", "")}>
                {selectedCategoryName}
              </Chip>
            )}
            {filters.woodType && (
              <Chip
                selected
                size="sm"
                dotColor={getSwatchColor(filters.woodType)}
                onRemove={() => updateFilter("woodType", "")}
              >
                {filters.woodType}
              </Chip>
            )}
            {filters.featured && (
              <Chip selected size="sm" onRemove={() => updateFilter("featured", false)}>
                پرفروش‌ها
              </Chip>
            )}
            {filters.priceRange !== "all" && (
              <Chip selected size="sm" onRemove={() => updateFilter("priceRange", "all")}>
                {priceRangeLabel}
              </Chip>
            )}
            {filters.search && (
              <Chip
                selected
                size="sm"
                onRemove={() => {
                  setSearchInput("");
                  updateFilter("search", "");
                }}
              >
                «{filters.search}»
              </Chip>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="mr-auto flex items-center gap-1 px-2 py-1 text-[var(--color-ink-soft)] transition-colors hover:text-red-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              پاک کردن همه
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-28 space-y-6 rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                <span className="flex items-center gap-2 font-serif text-sm font-bold text-[var(--color-ink)]">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--color-accent)]" />
                  فیلترها
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] text-[var(--color-ink-muted)] hover:text-red-700"
                  >
                    حذف
                  </button>
                )}
              </div>
              {filterControls}
            </div>
          </aside>

          <main className="space-y-6 lg:col-span-9">
            <div className="flex items-center justify-between px-1 text-xs text-[var(--color-ink-soft)] sm:text-sm">
              <span>
                <strong>{toPersianDigits(products.length)}</strong> اثر از{" "}
                <strong>{toPersianDigits(total)}</strong> دست‌سازه
              </span>
              {loading && (
                <span className="animate-pulse text-[11px] font-medium text-[var(--color-accent)]">
                  در حال به‌روزرسانی…
                </span>
              )}
            </div>

            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((key) => (
                  <div
                    key={key}
                    className="h-96 animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60"
                  />
                ))}
              </div>
            ) : isEmpty ? (
              <EmptyState
                icon={<Trees className="h-7 w-7" />}
                title="اثری با این فیلترها پیدا نشد"
                description="می‌توانید فیلترها را پاک کنید یا گونهٔ چوب دیگری را انتخاب کنید."
                action={
                  <Button size="sm" onClick={clearAllFilters}>
                    بازنشانی فیلترها
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 pt-6 sm:flex-row sm:justify-center">
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || loading}
                    className="gap-1 text-xs"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    قبلی
                  </Button>

                  {pageWindow(page, totalPages).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-9 w-9 rounded-xl text-xs font-bold transition-all ${
                        pageNumber === page
                          ? "bg-[var(--color-accent)] text-white"
                          : "border border-[var(--color-border)] bg-white text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)]"
                      }`}
                    >
                      {toPersianDigits(pageNumber)}
                    </button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || loading}
                    className="gap-1 text-xs"
                  >
                    بعدی
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  صفحهٔ {toPersianDigits(page)} از {toPersianDigits(totalPages)}
                </span>
              </div>
            )}
          </main>
        </div>
      </div>

      <Sheet open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} side="right">
        <SheetHeader onClose={() => setMobileFilterOpen(false)}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-[var(--color-accent)]" />
            <SheetTitle>فیلترهای کاتالوگ</SheetTitle>
          </div>
        </SheetHeader>

        <SheetContent className="space-y-6 overflow-y-auto">{filterControls}</SheetContent>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={clearAllFilters}>
            پاک کردن
          </Button>
          <Button className="flex-1" onClick={() => setMobileFilterOpen(false)}>
            مشاهدهٔ {toPersianDigits(total)} نتیجه
          </Button>
        </SheetFooter>
      </Sheet>

    </div>
  );
}
