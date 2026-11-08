import { Suspense } from "react";
import { ProductsClient } from "./ProductsClient";
import { getCategories, getFacets, getProducts } from "@/lib/api";

const SITE_NAME = "Rootwood Group";
const PAGE_SIZE = 24;

const SORTS = new Set([
  "newest",
  "price-asc",
  "price-desc",
  "rating",
  "name",
]);

type SearchValue = string | string[] | undefined;
type SearchParams = Promise<Record<string, SearchValue>>;

interface ProductsPageProps {
  searchParams: SearchParams;
}

function first(value: SearchValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function parsePage(value: SearchValue): number {
  const parsed = Number(first(value));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), 10_000);
}

function parsePrice(value: SearchValue): number | undefined {
  const parsed = Number(first(value));
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.floor(parsed);
}

function parseSort(value: SearchValue) {
  const sort = first(value);
  return sort && SORTS.has(sort)
    ? (sort as "newest" | "price-asc" | "price-desc" | "rating" | "name")
    : "newest";
}

export async function generateMetadata() {
  return {
    title: SITE_NAME + " — محصولات",
    description: "مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی — میز، نشیمن، ذخیره‌سازی و دکور.",
    alternates: { canonical: "/products" },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      siteName: SITE_NAME,
      title: SITE_NAME + " — محصولات",
      description: "مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی — میز، نشیمن، ذخیره‌سازی و دکور.",
      url: "/products",
      images: [{ url: "/images/oak-dining-table.webp", alt: SITE_NAME + " — محصولات" }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME + " — محصولات",
      description: "مبلمان دست‌ساز از بلوط ایرانی، گردوی آمریکایی، گیلاس آمریکایی و توت ایرانی — میز، نشیمن، ذخیره‌سازی و دکور.",
      images: ["/images/oak-dining-table.webp"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const page = parsePage(params.page);
  const search = first(params.search)?.slice(0, 80);
  const category = first(params.category)?.slice(0, 80);
  const woodType = first(params.woodType)?.slice(0, 80);
  const featuredRaw = first(params.featured);
  const featured =
    featuredRaw === "true" ? true : featuredRaw === "false" ? false : undefined;
  const minPrice = parsePrice(params.minPrice);
  const maxPrice = parsePrice(params.maxPrice);
  const sort = parseSort(params.sort);
  const offset = (page - 1) * PAGE_SIZE;

  const [categories, facets, products] = await Promise.all([
    getCategories().catch(() => []),
    getFacets().catch(() => ({ woodTypes: [], priceMin: 0, priceMax: 0 })),
    getProducts({
      search,
      category,
      woodType,
      featured,
      minPrice,
      maxPrice,
      sort,
      limit: PAGE_SIZE,
      offset,
    }).catch(() => ({
      items: [],
      total: 0,
      limit: PAGE_SIZE,
      offset,
      hasMore: false,
    })),
  ]);

  return (
    <Suspense>
      <ProductsClient
        products={products.items}
        total={products.total}
        categories={categories}
        woodTypes={facets.woodTypes}
        currentPage={page}
        pageSize={PAGE_SIZE}
      />
    </Suspense>
  );
}
