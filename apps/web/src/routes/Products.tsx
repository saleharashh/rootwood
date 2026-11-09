import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowLeft,
  ArrowRight,
  Flame,
  Sparkles,
  RotateCcw,
  Tag,
  Trees,
  Check,
  Grid3X3,
  Layers,
} from "lucide-react";
import { api, type Category, type Product, type CatalogFacets } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Sheet, SheetHeader, SheetTitle, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatPriceToman, toPersianDigits } from "@/lib/price";

const WOOD_SWATCHES: Record<string, string> = {
  "گردو": "#3b2216",
  "گردوی سیاه": "#3b2216",
  "گردوی تیره": "#321d13",
  "بلوط": "#c49a6c",
  "بلوط جنگلی": "#b88a59",
  "بلوط ایرانی": "#a67c52",
  "راش": "#d9b38c",
  "راش گرجستان": "#cf9e70",
  "چنار": "#b58763",
  "گیلاس": "#8c4331",
  "گیلاس آمریکایی": "#8c4331",
  "توت": "#9e6938",
  "توت ایرانی": "#9e6938",
};

export function Products() {
  const [, setLocation] = useLocation();
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
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const pageSize = 12;

  // Sync state from URL parameters
  const syncFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search") || "";
    const cat = params.get("category") || "";
    const wood = params.get("woodType") || "";
    const feat = params.get("featured");
    const s = params.get("sort") || "newest";
    const p = params.get("page") || "1";
    const pr = params.get("priceRange") || "all";

    setSearch(q);
    setCategory(cat);
    setWoodType(wood);
    setFeatured(feat === "true" ? true : null);
    setSort(s);
    setPriceRange(pr);
    setPage(Math.max(1, parseInt(p, 10) || 1));
  }, []);

  useEffect(() => {
    syncFromUrl();
  }, [syncFromUrl]);

  // Load categories and facets
  useEffect(() => {
    Promise.all([
      api.getCategories().catch(() => ({ categories: [] })),
      api.getFacets().catch(() => ({ woodTypes: [], priceMin: 0, priceMax: 0 })),
    ]).then(([catRes, f]) => {
      setCategories(catRes.categories || []);
      setFacets(f || { woodTypes: [], priceMin: 0, priceMax: 0 });
    });
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set("search", search.trim());
      if (category) q.set("category", category);
      if (woodType) q.set("woodType", woodType);
      if (featured !== null) q.set("featured", String(featured));
      if (sort) q.set("sort", sort);
      if (priceRange !== "all") q.set("priceRange", priceRange);

      if (priceRange === "under-5m") {
        q.set("maxPrice", "5000000");
      } else if (priceRange === "5m-15m") {
        q.set("minPrice", "5000000");
        q.set("maxPrice", "15000000");
      } else if (priceRange === "above-15m") {
        q.set("minPrice", "15000000");
      }

      q.set("limit", String(pageSize));
      q.set("offset", String((page - 1) * pageSize));

      const qs = q.toString();
      window.history.replaceState(null, "", `/products${qs ? `?${qs}` : ""}`);

      const res = await api.getProducts(Object.fromEntries(q.entries()));
      setProducts(res.items || []);
      setTotal(res.total || 0);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, category, woodType, featured, priceRange, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const clearAllFilters = () => {
    setSearch("");
    setCategory("");
    setWoodType("");
    setFeatured(null);
    setPriceRange("all");
    setSort("newest");
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (category) count++;
    if (woodType) count++;
    if (featured !== null) count++;
    if (priceRange !== "all") count++;
    return count;
  }, [search, category, woodType, featured, priceRange]);

  const selectedCategoryName = useMemo(() => {
    return categories.find((c) => c.slug === category)?.name || "";
  }, [categories, category]);

  // Swatch color helper
  const getSwatchColor = (wood: string) => {
    for (const [key, color] of Object.entries(WOOD_SWATCHES)) {
      if (wood.includes(key)) return color;
    }
    return "#8c6239";
  };

  return (
    <div className="bg-[#fcfbf9] min-h-[85vh] pb-24">
      {/* Editorial Atelier Banner */}
      <div className="border-b border-stone-200/80 bg-gradient-to-b from-stone-100/70 to-[#fcfbf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="wood" className="text-xs px-3 py-1">
                آتلیه نجاری سنتی روت‌وود
              </Badge>
              {featured && (
                <Badge variant="gold" className="text-xs px-3 py-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  شاهکارهای پرفروش
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-stone-900 tracking-tight leading-tight">
              {featured
                ? "پرفروش‌ترین دست‌سازه‌های چوبی کارگاه"
                : category
                ? `مجموعه ${selectedCategoryName}`
                : "کاتالوگ جامع دست‌سازه‌های چوب طبیعی"}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl font-light">
              خلق آثاری ماندگار از گونه‌های کهنسال بلوط، گردو، گیلاس و توت ایرانی با اتصالات اصیل نجاری و فینیش روغن‌های گیاهی ارگانیک بدون سم.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Top Control Bar: Search + Quick Sort Tabs + Mobile Filter Trigger */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو بر اساس نام دست‌سازه، گونه چوب..."
              className="pr-10 pl-8 bg-stone-50/60"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 justify-between md:justify-end">
            {/* Mobile Filter Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden gap-2 border-stone-200/90 text-stone-700"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-950" />
              <span>فیلترها</span>
              {activeFiltersCount > 0 && (
                <span className="bg-amber-950 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                  {toPersianDigits(activeFiltersCount)}
                </span>
              )}
            </Button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
              <span className="hidden sm:inline shrink-0">مرتب‌سازی:</span>
              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-44 text-xs font-semibold bg-stone-50/60"
              >
                <option value="newest">جدیدترین دست‌سازه‌ها</option>
                <option value="price-asc">ارزان‌ترین قیمت</option>
                <option value="price-desc">گران‌ترین قیمت</option>
                <option value="name">بر اساس نام اثر</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filter Pills Bar (Chips) */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-900/10 text-xs animate-in fade-in duration-200">
            <span className="font-semibold text-amber-950 flex items-center gap-1.5 shrink-0">
              <Tag className="w-3.5 h-3.5 text-amber-800" />
              فیلترهای اعمال‌شده:
            </span>

            {category && (
              <Chip
                selected
                size="sm"
                onRemove={() => {
                  setCategory("");
                  setPage(1);
                }}
              >
                دسته: {selectedCategoryName}
              </Chip>
            )}

            {woodType && (
              <Chip
                selected
                size="sm"
                dotColor={getSwatchColor(woodType)}
                onRemove={() => {
                  setWoodType("");
                  setPage(1);
                }}
              >
                گونه چوب: {woodType}
              </Chip>
            )}

            {featured && (
              <Chip
                selected
                size="sm"
                onRemove={() => {
                  setFeatured(null);
                  setPage(1);
                }}
              >
                فقط پرفروش‌ها
              </Chip>
            )}

            {priceRange !== "all" && (
              <Chip
                selected
                size="sm"
                onRemove={() => {
                  setPriceRange("all");
                  setPage(1);
                }}
              >
                محدوده قیمت
              </Chip>
            )}

            {search && (
              <Chip
                selected
                size="sm"
                onRemove={() => {
                  setSearch("");
                  setPage(1);
                }}
              >
                جستجو: «{search}»
              </Chip>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-stone-500 hover:text-red-700 font-semibold text-xs mr-auto flex items-center gap-1 transition-colors px-2 py-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              پاک کردن همه فیلترها
            </button>
          </div>
        )}

        {/* Catalog Main Layout: Sidebar (Desktop) + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================================= */}
          {/* DESKTOP FILTER SIDEBAR (4 cols)                                          */}
          {/* ========================================================================= */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-28">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2 font-bold font-serif text-stone-900 text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-amber-900" />
                  <span>فیلترهای تخصصی کارگاه</span>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] text-stone-500 hover:text-red-700 transition-colors"
                  >
                    حذف فیلترها
                  </button>
                )}
              </div>

              {/* 1. Category Checkbox Group */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
                  دسته‌بندی‌های آثار
                </label>
                <div className="space-y-2.5">
                  <Checkbox
                    checked={category === ""}
                    onCheckedChange={() => {
                      setCategory("");
                      setPage(1);
                    }}
                    label="همه دسته‌بندی‌ها"
                  />
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <Checkbox
                        checked={category === c.slug}
                        onCheckedChange={() => {
                          setCategory(category === c.slug ? "" : c.slug);
                          setPage(1);
                        }}
                        label={c.name}
                      />
                      {c.productCount !== undefined && (
                        <span className="text-[11px] text-stone-400 font-mono">
                          ({toPersianDigits(c.productCount)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 2. Wood Species Swatch Chips */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
                    گونه چوب طبیعی
                  </label>
                  {woodType && (
                    <button
                      type="button"
                      onClick={() => {
                        setWoodType("");
                        setPage(1);
                      }}
                      className="text-[10px] text-amber-900 hover:underline"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {facets.woodTypes.map((w) => {
                    const isSelected = woodType === w;
                    return (
                      <Chip
                        key={w}
                        selected={isSelected}
                        size="sm"
                        dotColor={getSwatchColor(w)}
                        onClick={() => {
                          setWoodType(isSelected ? "" : w);
                          setPage(1);
                        }}
                      >
                        {w}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* 3. Price Preset Chips */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
                  محدوده بودجه خرید
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: "all", label: "تمام قیمت‌ها" },
                    { id: "under-5m", label: "کمتر از ۵ میلیون تومان" },
                    { id: "5m-15m", label: "۵ تا ۱۵ میلیون تومان" },
                    { id: "above-15m", label: "بیش از ۱۵ میلیون تومان" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPriceRange(p.id);
                        setPage(1);
                      }}
                      className={`text-right px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                        priceRange === p.id
                          ? "bg-amber-950 text-amber-50 font-bold shadow-2xs"
                          : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <span>{p.label}</span>
                      {priceRange === p.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 4. Special Workshop Badges */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
                  فیلترهای ویژه
                </label>
                <Checkbox
                  checked={featured === true}
                  onCheckedChange={(checked) => {
                    setFeatured(checked ? true : null);
                    setPage(1);
                  }}
                  label="شاهکارهای پرفروش کارگاه"
                  description="آثار با بیشترین سفارش و استقبال مشتریان"
                />
              </div>
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* PRODUCT GRID (9 cols)                                                    */}
          {/* ========================================================================= */}
          <main className="lg:col-span-9 space-y-6">
            {/* Total Results Counter */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-stone-600 px-1">
              <span>
                نمایش <strong>{toPersianDigits(products.length)}</strong> اثر از مجموع{" "}
                <strong>{toPersianDigits(total)}</strong> دست‌سازه چوبی
              </span>
              {loading && (
                <span className="text-amber-900 font-medium animate-pulse text-xs">
                  در حال به‌روزرسانی آثار...
                </span>
              )}
            </div>

            {/* Loading Skeleton / Empty State / Grid */}
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-96 rounded-3xl bg-stone-200/60 animate-pulse border border-stone-200"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center space-y-4 shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center mx-auto border border-amber-200/60">
                  <Trees className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  اثری متناسب با این فیلترها یافت نشد
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                  می‌توانید فیلترهای اعمال‌شده را پاک کنید یا گونه چوب دیگری را برای جستجو انتخاب فرمایید.
                </p>
                <Button variant="default" size="sm" onClick={clearAllFilters} className="mt-2">
                  بازنشانی همه فیلترها
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="gap-1 text-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>صفحه قبل</span>
                </Button>

                <div className="flex items-center gap-1 px-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pNum = i + 1;
                    const isCurrent = pNum === page;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setPage(pNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-amber-950 text-amber-50 shadow-2xs"
                            : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                        }`}
                      >
                        {toPersianDigits(pNum)}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="gap-1 text-xs"
                >
                  <span>صفحه بعد</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE FILTER DRAWER (Sheet)                                             */}
      {/* ========================================================================= */}
      <Sheet open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} side="right">
        <SheetHeader onClose={() => setMobileFilterOpen(false)}>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-900" />
            <SheetTitle>فیلترهای کاتالوگ آثار</SheetTitle>
          </div>
        </SheetHeader>

        <SheetContent className="space-y-6 overflow-y-auto">
          {/* 1. Category Checkboxes */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
              دسته‌بندی‌های آثار
            </label>
            <div className="space-y-2.5">
              <Checkbox
                checked={category === ""}
                onCheckedChange={() => {
                  setCategory("");
                  setPage(1);
                }}
                label="همه دسته‌بندی‌ها"
              />
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <Checkbox
                    checked={category === c.slug}
                    onCheckedChange={() => {
                      setCategory(category === c.slug ? "" : c.slug);
                      setPage(1);
                    }}
                    label={c.name}
                  />
                  {c.productCount !== undefined && (
                    <span className="text-[11px] text-stone-400 font-mono">
                      ({toPersianDigits(c.productCount)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 2. Wood Species Swatch Chips */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
              گونه چوب طبیعی
            </label>
            <div className="flex flex-wrap gap-2">
              {facets.woodTypes.map((w) => {
                const isSelected = woodType === w;
                return (
                  <Chip
                    key={w}
                    selected={isSelected}
                    size="sm"
                    dotColor={getSwatchColor(w)}
                    onClick={() => {
                      setWoodType(isSelected ? "" : w);
                      setPage(1);
                    }}
                  >
                    {w}
                  </Chip>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* 3. Budget Range */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
              محدوده بودجه خرید
            </label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: "all", label: "تمام قیمت‌ها" },
                { id: "under-5m", label: "کمتر از ۵ میلیون تومان" },
                { id: "5m-15m", label: "۵ تا ۱۵ میلیون تومان" },
                { id: "above-15m", label: "بیش از ۱۵ میلیون تومان" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPriceRange(p.id);
                    setPage(1);
                  }}
                  className={`text-right px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                    priceRange === p.id
                      ? "bg-amber-950 text-amber-50 font-bold shadow-2xs"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <span>{p.label}</span>
                  {priceRange === p.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 4. Featured Checkbox */}
          <div className="space-y-2">
            <Checkbox
              checked={featured === true}
              onCheckedChange={(checked) => {
                setFeatured(checked ? true : null);
                setPage(1);
              }}
              label="شاهکارهای پرفروش کارگاه"
              description="آثار با بیشترین سفارش و استقبال مشتریان"
            />
          </div>
        </SheetContent>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            size="default"
            className="flex-1"
            onClick={clearAllFilters}
          >
            پاک کردن
          </Button>
          <Button
            variant="default"
            size="default"
            className="flex-1"
            onClick={() => setMobileFilterOpen(false)}
          >
            مشاهده نتایج ({toPersianDigits(total)})
          </Button>
        </SheetFooter>
      </Sheet>
    </div>
  );
}
