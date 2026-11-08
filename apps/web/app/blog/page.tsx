import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogClient } from "./BlogClient";
import { getBlogPosts, getBlogTags } from "@/lib/api";
import type { BlogPost } from "@/lib/api";

const description =
  "یادداشت‌هایی درباره چوب، پرداخت سطح و زندگی خوب با مبلمان دست‌ساز.";
const socialImage = "/images/oak-dining-table-detail.webp";

export const metadata: Metadata = {
  title: "مجله",
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "کرفتدرات",
    title: "مجله | کرفتدرات",
    description,
    url: "/blog",
    images: [{ url: socialImage, alt: "مجله مبلمان چوبی کرفتدرات" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "مجله | کرفتدرات",
    description,
    images: [socialImage],
  },
};

type SearchValue = string | string[] | undefined;

interface BlogPageProps {
  searchParams: Promise<Record<string, SearchValue>>;
}

function first(value: SearchValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const pageParam = Number(first(params.page));
  const page =
    Number.isFinite(pageParam) && pageParam >= 1
      ? Math.min(Math.floor(pageParam), 10_000)
      : 1;
  const tag = first(params.tag)?.slice(0, 60);
  const q = first(params.q)?.slice(0, 80);

  const [posts, tags] = await Promise.all([
    getBlogPosts({ page, tag, q }).catch(() => ({
      items: [],
      total: 0,
      page,
      limit: 10,
      hasMore: false,
    })),
    getBlogTags().catch(() => []),
  ]);

  return (
    <Suspense>
      <BlogClient
        posts={posts.items as BlogPost[]}
        tags={tags}
        total={posts.total}
        page={posts.page}
        pageSize={posts.limit}
        loading={false}
      />
    </Suspense>
  );
}
