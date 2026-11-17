import type { BlogPost, Product } from "./api";
import { SITE_CONTACT, SITE_DESCRIPTION, SITE_NAME, SITE_NAME_EN, SITE_URL, DEFAULT_OG_IMAGE } from "./site-config";

export interface SeoConfig {
  title: string;
  description: string;
  /** Path without origin, e.g. "/products/walnut-coffee-table". */
  path: string;
  image?: string | null;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: unknown | unknown[];
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteImage(src?: string | null): string {
  if (!src) return absoluteUrl(DEFAULT_OG_IMAGE);
  if (/^https?:\/\//i.test(src)) return src;
  return absoluteUrl(src.startsWith("/") ? src : `/${src}`);
}

export function stripHtml(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function trimDescription(value?: string | null, max = 158): string {
  const text = stripHtml(value);
  if (!text) return SITE_DESCRIPTION;
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
}

export function pageTitle(title?: string | null): string {
  if (!title) return `${SITE_NAME} | مبلمان دست‌ساز چوب طبیعی`;
  if (title.includes(SITE_NAME)) return title;
  return `${title} | ${SITE_NAME}`;
}

export function productTitle(product: Pick<Product, "name" | "title">): string {
  return (product.name || product.title || "دست‌سازهٔ چوبی").trim();
}

export function productImage(product: Product): string {
  return product.images?.[0]?.url || product.imageUrl || DEFAULT_OG_IMAGE;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME_EN,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/images/logo-512.png"),
  email: SITE_CONTACT.email,
  telephone: `+98${SITE_CONTACT.phone.replace(/^0/, "")}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: SITE_CONTACT.city,
    addressRegion: SITE_CONTACT.province,
    addressCountry: SITE_CONTACT.country,
    streetAddress: SITE_CONTACT.address,
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "fa-IR",
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${SITE_URL}/#store`,
    name: SITE_NAME,
    image: absoluteUrl("/images/workshop.webp"),
    url: absoluteUrl("/contact"),
    telephone: `+98${SITE_CONTACT.phone.replace(/^0/, "")}`,
    email: SITE_CONTACT.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONTACT.address,
      addressLocality: SITE_CONTACT.city,
      addressRegion: SITE_CONTACT.province,
      addressCountry: SITE_CONTACT.country,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "09:00",
      closes: "18:00",
    },
  };
}

export function productJsonLd(product: Product, path: string) {
  const inStock = (product.stock ?? 0) > 0;
  const rating = typeof product.rating === "number" ? product.rating : product.ratingObj?.average;
  const reviewCount = product.reviewsCount ?? product.ratingObj?.count ?? 0;

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productTitle(product),
    description: trimDescription(product.description || product.tagline || product.shortDescription, 300),
    image: [absoluteImage(productImage(product))],
    sku: product.sku || product.id,
    category: product.category?.name,
    brand: { "@type": "Brand", name: SITE_NAME },
    url: absoluteUrl(path),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      // Stored prices are in Toman; schema.org IRR expects Rial.
      price: Math.round((product.price || 0) * 10),
      priceCurrency: "IRR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  if (rating && reviewCount > 0) {
    payload.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.toFixed(1)),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return payload;
}

export function articleJsonLd(post: BlogPost, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: trimDescription(post.excerpt, 200),
    image: [absoluteImage(post.coverImage)],
    url: absoluteUrl(path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.publishedAt || post.createdAt,
    author: { "@type": "Person", name: post.author?.name || post.authorName || SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME_EN,
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/logo-512.png") },
    },
    inLanguage: "fa-IR",
  };
}

/* -------------------------------------------------------------------------- */
/* Head manager                                                                */
/* -------------------------------------------------------------------------- */

const MANAGED = "data-seo-managed";

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(MANAGED, "true");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute(MANAGED, "true");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * React 19 hoists <title>/<meta>/<link> but does not deduplicate them, which
 * would leave two titles when the server-rendered shell already has one.
 * Updating by selector keeps exactly one tag per key on every navigation.
 */
export function applySeo(config: SeoConfig): void {
  const title = pageTitle(config.title);
  const description = trimDescription(config.description);
  const url = absoluteUrl(config.path);
  const image = absoluteImage(config.image);

  document.title = title;

  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", config.noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large");

  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:locale", "fa_IR");
  upsertMeta("property", "og:type", config.type || "website");
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", image);
  upsertMeta("property", "og:image:alt", title);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", image);

  upsertLink("canonical", url);

  const existing = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld="page"]');
  if (config.jsonLd) {
    const script = existing || document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "page");
    script.textContent = JSON.stringify(config.jsonLd);
    if (!existing) document.head.appendChild(script);
  } else if (existing) {
    existing.remove();
  }
}
