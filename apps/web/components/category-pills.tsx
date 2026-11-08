import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Category } from "@/lib/api";

interface FilterPillsProps {
  categories: Category[];
  woodTypes: string[];
  currentCat?: string;
  currentWood?: string;
  currentFeatured?: boolean | null;
}

export function FilterPills({
  categories,
  woodTypes,
  currentCat,
  currentWood,
  currentFeatured,
}: FilterPillsProps) {
  const searchParams = useSearchParams();

  function buildUrl(overrides: Record<string, string | boolean | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    return `/products?${params.toString()}`;
  }

  function active(key: string, value: string | boolean | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
      return !p.has(key);
    }
    return String(p.get(key) ?? "") === String(value);
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
      {/* Categories */}
      <Link
        href={buildUrl({ category: null, woodType: null, featured: null })}
        className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
          active("category", null) && active("woodType", null) && active("featured", null)
            ? "bg-[var(--color-wood)] text-white shadow-xs"
            : "bg-white text-[var(--color-ink-soft)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
        }`}
      >
        همه
      </Link>

      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={buildUrl({ category: cat.slug, woodType: null, featured: null })}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
            currentCat === cat.slug
              ? "bg-[var(--color-wood)] text-white shadow-xs"
              : "bg-white text-[var(--color-ink-soft)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
          }`}
        >
          {cat.name}
          <span className="ms-1.5 text-[11px] opacity-70">
            ({cat.productCount.toLocaleString("fa-IR")})
          </span>
        </Link>
      ))}

      {/* Wood types separator */}
      <span className="self-center text-xs font-medium text-[var(--color-ink-mute)] px-1">گونه چوب:</span>
      {woodTypes.map((wood) => (
        <Link
          key={wood}
          href={buildUrl({ category: null, woodType: wood, featured: null })}
          className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
            currentWood === wood
              ? "bg-[var(--color-accent)] text-white shadow-xs"
              : "bg-white text-[var(--color-ink-soft)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
          }`}
        >
          {wood}
        </Link>
      ))}

      {/* Featured toggle */}
      <Link
        href={buildUrl({ featured: currentFeatured ? null : "true", category: null, woodType: null })}
        className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
          currentFeatured
            ? "bg-[var(--color-wood)] text-white shadow-xs"
            : "bg-white text-[var(--color-ink-soft)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
        }`}
      >
        {currentFeatured ? "فقط پرفروش‌ها" : "نمایش پرفروش‌ها"}
      </Link>
    </div>
  );
}
