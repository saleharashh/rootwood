import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/api";
import BlogPostPage, {
  generateMetadata as buildPostMetadata,
} from "./blog-post";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const fallbackSlugs = [
    "choosing-the-right-wood-for-your-home",
    "how-we-finish-our-furniture",
    "coffee-table-heights-and-living-room-scale",
  ];
  try {
    const res = await getBlogPosts({ page: 1 });
    if (res?.items && res.items.length > 0) {
      return res.items.map((p) => ({ slug: p.slug }));
    }
  } catch {}
  return fallbackSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: BlogPostPageProps,
): Promise<Metadata> {
  return buildPostMetadata(props);
}

export default BlogPostPage;
