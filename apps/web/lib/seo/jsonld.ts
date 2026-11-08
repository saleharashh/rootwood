/**
 * JSON-LD Structured Data helpers for Rootwood Group e-commerce.
 * Creates schema.org compliant JSON-LD for Organization, WebSite, Product, BreadcrumbList, Article, FAQPage.
 */

const SITE_NAME = "Rootwood Group";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const LOGO_URL = "/images/logo.webp";

interface OrganizationOpts {
  name?: string;
  url?: string;
  logo?: string;
  addressCountry?: string;
  telephone?: string;
  contactType?: string;
  availableLanguage?: string[];
  sameAs?: string[];
  foundingDate?: string;
}

interface WebsiteOpts {
  name?: string;
  url?: string;
  searchUrlTemplate?: string;
}

interface ProductOpts {
  name: string;
  slug: string;
  images: string[];
  description: string;
  price: number;
  priceCurrency?: string;
  sku: string;
  stock: number;
  brandName?: string;
  url?: string;
  ratingAverage?: number;
  ratingCount?: number;
  reviews?: Array<{
    authorName: string;
    ratingValue: number;
    datePublished: string;
    reviewBody: string;
  }>;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ArticleOpts {
  headline: string;
  description: string;
  image: string | string[];
  authorName: string;
  datePublished: string;
  dateModified: string;
  url: string;
  publisherName?: string;
  publisherLogo?: string;
}

interface FAQQuestion {
  question: string;
  answer: string;
}

export function organizationJsonLd(opts: OrganizationOpts = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name || SITE_NAME,
    url: opts.url || SITE_URL,
    logo: opts.logo || LOGO_URL,
    address: { "@type": "PostalAddress", addressCountry: opts.addressCountry || "IR" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: opts.telephone || "+98 21 1234 5678",
      contactType: opts.contactType || "customer service",
      availableLanguage: opts.availableLanguage || ["fa", "en"],
    },
    sameAs: opts.sameAs || [],
    ...(opts.foundingDate ? { foundingDate: opts.foundingDate } : {}),
  };
}

export function websiteJsonLd(opts: WebsiteOpts = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: opts.name || SITE_NAME,
    url: opts.url || SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: opts.searchUrlTemplate || SITE_URL + "/products?search={search_string}" },
      "query-input": "required name=search_string",
    },
  };
}

interface JsonLdReview {
  "@type": "Review";
  author: { "@type": "Person"; name: string };
  rating: { "@type": "Rating"; ratingValue: number };
  datePublished: string;
  reviewBody: string;
}

interface JsonLdProduct {
  "@context": string;
  "@type": "Product";
  name: string;
  slug: string;
  image: string[];
  description: string;
  brand: { "@type": "Brand"; name: string };
  offers: {
    "@type": "Offer";
    url: string;
    priceCurrency: string;
    price: number;
    itemCondition: string;
    availability: string;
    seller: { "@type": "Organization"; name: string };
  };
  sku: string;
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
  };
  review?: JsonLdReview[];
}

/**
 * Shop prices are stored in Toman, but schema.org/Google expect the official
 * Rial currency (IRR). Converting here keeps rich results accurate instead of
 * understating every price by a factor of ten.
 */
const TOMAN_TO_RIAL = 10;

export function productJsonLd(opts: ProductOpts) {
  const isInStock = opts.stock > 0;
  const baseUrl = opts.url || SITE_URL + "/products/" + opts.slug;
  const currency = opts.priceCurrency || "IRR";
  const product: JsonLdProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    slug: opts.slug,
    image: opts.images,
    description: opts.description,
    brand: { "@type": "Brand", name: opts.brandName || SITE_NAME },
    offers: {
      "@type": "Offer",
      url: baseUrl,
      priceCurrency: currency,
      price: currency === "IRR" ? opts.price * TOMAN_TO_RIAL : opts.price,
      itemCondition: "https://schema.org/NewCondition",
      availability: isInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
    sku: opts.sku,
  };
  if (opts.ratingAverage !== undefined && opts.ratingCount !== undefined) {
    product.aggregateRating = { "@type": "AggregateRating", ratingValue: opts.ratingAverage, reviewCount: opts.ratingCount };
  }
  if (opts.reviews?.length) {
    product.review = opts.reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      rating: { "@type": "Rating", ratingValue: r.ratingValue },
      datePublished: r.datePublished,
      reviewBody: r.reviewBody,
    }));
  }
  return product;
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item: BreadcrumbItem, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : SITE_URL + item.url,
    })),
  };
}

export function articleJsonLd(opts: ArticleOpts) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    image: opts.image,
    author: { "@type": "Person", name: opts.authorName },
    publisher: {
      "@type": "Organization",
      name: opts.publisherName || SITE_NAME,
      logo: { "@type": "ImageObject", url: opts.publisherLogo || LOGO_URL },
    },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    url: opts.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  };
}

export function faqPageJsonLd(questions: FAQQuestion[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q: FAQQuestion) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}
