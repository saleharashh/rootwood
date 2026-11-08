import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL.replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/products", "/blog", "/about", "/contact"],
      disallow: [
        "/admin",
        "/account",
        "/cart",
        "/checkout",
        "/signin",
        "/signup",
        "/order-confirmation",
        "/api",
        "/products?search=",
        "/products?sort=",
        "/products?page=",
      ],
    },
    sitemap: baseUrl + "/sitemap.xml",
  };
}
