#!/usr/bin/env node
/**
 * Generates static HTML shells with route-specific <head> metadata after
 * `vite build`. The body stays the SPA (#root is empty); crawlers and social
 * scrapers get the correct title/canonical/OG/JSON-LD without a Node server.
 *
 * Usage: node scripts/prerender-seo.mjs
 * Env:   SEO_API_URL (default http://127.0.0.1:8000/api)
 *        VITE_SITE_URL / SITE_URL (default https://rootwoodgroup.ir)
 *
 * Fails soft: a missing API leaves the SPA build intact with a warning.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://rootwoodgroup.ir").replace(/\/+$/, "");
const apiCandidates = [
  process.env.SEO_API_URL,
  "http://127.0.0.1:8000/api",
  "http://127.0.0.1:8000",
].filter(Boolean);

const seoBlock = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;

function abs(path) {
  if (!path) return `${siteUrl}/images/logo-512.png`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plain(value, max = 158) {
  const text = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
}

function titleTag(title) {
  return title.includes("روت‌وود") ? title : `${title} | روت‌وود`;
}

function buildHead({ title, description, path, image, type = "website", noindex = false, jsonLd }) {
  const url = abs(path);
  const fullTitle = titleTag(title);
  const desc = plain(description);
  const img = abs(image);
  const tags = [
    `<title>${escapeHtml(fullTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(desc)}">`,
    `<meta name="robots" content="${noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:site_name" content="روت‌وود">`,
    `<meta property="og:locale" content="fa_IR">`,
    `<meta property="og:type" content="${escapeHtml(type)}">`,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(desc)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(img)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}">`,
    `<meta name="twitter:image" content="${escapeHtml(img)}">`,
  ];
  const graph = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];
  for (const item of graph) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(item).replace(/</g, "\\u003c")}</script>`);
  }
  return `<!-- seo:start -->\n    ${tags.join("\n    ")}\n    <!-- seo:end -->`;
}

async function fetchJson(path) {
  let lastError;
  for (const base of apiCandidates) {
    try {
      const res = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchAllByOffset(path, collect, limit) {
  const items = [];
  for (let offset = 0; offset < 2000; offset += limit) {
    const page = await fetchJson(`${path}?limit=${limit}&offset=${offset}`);
    const batch = collect(page);
    items.push(...batch);
    if (!page.hasMore || batch.length === 0) break;
  }
  return items;
}

async function fetchAllByPage(path, collect, limit) {
  const items = [];
  for (let page = 1; page <= 20; page++) {
    const payload = await fetchJson(`${path}?limit=${limit}&page=${page}`);
    const batch = collect(payload);
    items.push(...batch);
    if (!payload.hasMore || batch.length === 0) break;
  }
  return items;
}

function productJsonLd(product, path) {
  const inStock = Number(product.stock ?? 0) > 0;
  const rating = Number(product.rating?.average ?? product.rating ?? 0);
  const count = Number(product.rating?.count ?? product.reviewsCount ?? 0);
  const payload = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name || product.title,
    description: plain(product.description || product.tagline, 300),
    image: [abs(product.images?.[0]?.url || product.imageUrl)],
    sku: product.sku || product.id,
    category: product.category?.name,
    brand: { "@type": "Brand", name: "روت‌وود" },
    url: abs(path),
    offers: {
      "@type": "Offer",
      url: abs(path),
      price: Math.round(Number(product.price || 0) * 10),
      priceCurrency: "IRR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "روت‌وود" },
    },
  };
  if (rating > 0 && count > 0) {
    payload.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.toFixed(1)),
      reviewCount: count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return payload;
}

function articleJsonLd(post, path) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: plain(post.excerpt, 200),
    image: [abs(post.coverImage)],
    url: abs(path),
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(path) },
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.publishedAt || post.createdAt,
    author: { "@type": "Person", name: post.author?.name || post.authorName || "روت‌وود" },
    publisher: {
      "@type": "Organization",
      name: "Rootwood Group",
      logo: { "@type": "ImageObject", url: abs("/images/logo-512.png") },
    },
    inLanguage: "fa-IR",
  };
}

function breadcrumbs(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

function writeShell(routePath, head) {
  const html = template.replace(seoBlock, head);
  const file = routePath === "/" ? join(distDir, "index.html") : join(distDir, routePath.replace(/^\//, ""), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html, "utf8");
  return routePath;
}

let template;
try {
  template = readFileSync(join(distDir, "index.html"), "utf8");
} catch {
  console.error("[seo] dist/index.html not found — run `vite build` first.");
  process.exit(1);
}

if (!seoBlock.test(template)) {
  console.error("[seo] SEO markers missing from index.html; skipping shells.");
  process.exit(0);
}

const STATIC_PAGES = [
  {
    path: "/",
    title: "روت‌وود | مبلمان دست‌ساز چوب طبیعی",
    description:
      "میز اسلب، نشیمن و دکور دست‌ساز از گردو، بلوط، گیلاس و توت ایرانی؛ ساخته‌شده در آتلیه روت‌وود با اتصالات اصیل نجاری و ارسال به سراسر ایران.",
    image: "/images/oak-dining-table.webp",
  },
  {
    path: "/products",
    title: "کاتالوگ دست‌سازه‌های چوب طبیعی",
    description:
      "کاتالوگ کامل میز، نشیمن، کتابخانه و دکور چوب طبیعی؛ ساخته‌شده در آتلیه روت‌وود با ارسال به سراسر ایران.",
  },
  {
    path: "/blog",
    title: "مجلهٔ چوب و راهنمای نگهداری",
    description:
      "مقالات تخصصی درباره گونه‌های چوب ایران، اتصالات نجاری سنتی، روغن‌های گیاهی و نگهداری مبلمان چوبی.",
  },
  {
    path: "/about",
    title: "دربارهٔ آتلیه و کارگاه",
    description:
      "داستان روت‌وود از سال ۱۳۹۴؛ نجاری سنتی با چوب پایدار، روغن‌های گیاهی و اتصالات اصیل برای ساخت مبلمانی که نسل‌ها می‌ماند.",
    image: "/images/workshop.webp",
  },
  {
    path: "/gallery",
    title: "گالری آثار اجراشده",
    description:
      "مشاهده گالری آثار، میزهای اسلب، نشیمن‌ها و پروژه‌های اختصاصی اجرا شده توسط آتلیه نجاری دست‌ساز روت‌وود با اتصالات اصیل و چوب طبیعی.",
    image: "/images/oak-dining-table.webp",
  },
  {
    path: "/contact",
    title: "تماس، مشاوره و سفارش ساخت اختصاصی",
    description:
      "تماس مستقیم با کارگاه روت‌وود در یزد؛ یزد، بلوار صابر یزدی غربی، ابتدای خیابان محمودی — تلفن ۰۹۱۳۱۵۳۴۵۳۲.",
  },
];

const written = [];

try {
  for (const page of STATIC_PAGES) {
    written.push(writeShell(page.path, buildHead({ ...page, type: "website" })));
  }

  const products = await fetchAllByOffset("/products", (page) => page.items || [], 100);
  for (const product of products) {
    if (!product.slug) continue;
    const path = `/products/${product.slug}`;
    written.push(
      writeShell(
        path,
        buildHead({
          title: product.name || product.title,
          description: plain(product.tagline || product.shortDescription || product.description),
          path,
          image: product.images?.[0]?.url || product.imageUrl,
          type: "product",
          jsonLd: [
            productJsonLd(product, path),
            breadcrumbs([
              { name: "خانه", path: "/" },
              { name: "کاتالوگ آثار", path: "/products" },
              { name: product.name || product.title, path },
            ]),
          ],
        })
      )
    );
  }

  const posts = await fetchAllByPage("/blog/posts", (page) => page.items || page.posts || [], 50);
  for (const post of posts) {
    if (!post.slug) continue;
    const path = `/blog/${post.slug}`;
    written.push(
      writeShell(
        path,
        buildHead({
          title: post.title,
          description: plain(post.excerpt),
          path,
          image: post.coverImage,
          type: "article",
          jsonLd: [
            articleJsonLd(post, path),
            breadcrumbs([
              { name: "خانه", path: "/" },
              { name: "مجلهٔ چوب", path: "/blog" },
              { name: post.title, path },
            ]),
          ],
        })
      )
    );
  }
} catch (error) {
  console.warn(
    `[seo] Could not reach the API (${apiCandidates[0] || "n/a"}): ${error?.message || error}`
  );
  console.warn("[seo] Skipped product/article shells; static shells are still generated.");
}

console.log(`[seo] Wrote ${written.length} HTML shells (${written.join(", ") || "none"}).`);
