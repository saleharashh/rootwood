import type { MetadataRoute } from "next";
import { getProducts, getCategories, getBlogPosts } from "@/lib/api";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL.replace(/\/+$/, "");

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl + "/",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: baseUrl + "/products",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: baseUrl + "/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: baseUrl + "/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: baseUrl + "/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts({ limit: 1000 }).catch(() => ({ items: [] }));
    productRoutes = (products.items || []).map((p) => ({
      url: baseUrl + "/products/" + p.slug,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}

  // Dynamic category routes (filtered product listing)
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories().catch(() => []);
    categoryRoutes = (categories || []).map((c) => ({
      url: baseUrl + "/products?category=" + c.slug,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {}

  // Dynamic blog post routes
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getBlogPosts({ page: 1 }).catch(() => ({ items: [] }));
    blogRoutes = (posts.items || []).map((p) => ({
      url: baseUrl + "/blog/" + p.slug,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {}

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
}
