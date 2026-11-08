import type { NextConfig } from "next";

/**
 * The storefront runs as a Node server (SSR) so that catalog search, filters,
 * pagination and security headers are handled per request. It talks to the
 * NestJS API either through `NEXT_PUBLIC_API_URL` or, when that is a relative
 * path, through the `/api` rewrite configured below.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Local WebP assets are already optimised and shipping `sharp` is optional
    // on small Node hosts.
    unoptimized: true,
  },
  devIndicators:
    process.env.NEXT_DISABLE_DEV_INDICATOR === "true" ? false : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
