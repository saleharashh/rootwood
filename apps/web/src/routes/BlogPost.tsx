import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowRight, Calendar, Clock, Share2, Tag, User } from "lucide-react";
import { api, type BlogPost } from "@/lib/api";
import { formatJalaliDate, toPersianDigits } from "@/lib/price";
import { useToast } from "@/components/toast-provider";

export function BlogPostView() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.getBlogPostBySlug(slug);
        if (isMounted) setPost(res.post);
      } catch (err: unknown) {
        if (isMounted) {
          showToast(err instanceof Error ? err.message : "خطا در بارگذاری مقاله", "error");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("پیوند مقاله کپی شد", "success");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-stone-900">مقاله مورد نظر یافت نشد</h1>
        <Link
          href="/blog"
          className="inline-block bg-amber-900 text-white px-5 py-2 rounded-xl text-xs font-semibold"
        >
          بازگشت به مقالات
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-stone-50/50 pb-24">
      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 overflow-x-auto">
            <Link href="/" className="hover:text-amber-900 transition shrink-0">خانه</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-amber-900 transition shrink-0">مجله چوب</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium truncate">{post.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        {/* Header */}
        <header className="space-y-4 text-center sm:text-right">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-800" />
                {post.authorName}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-800" />
                {formatJalaliDate(post.publishedAt || post.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-800" />
                {toPersianDigits(post.readingTimeMinutes || 5)} دقیقه مطالعه
              </span>
            </div>

            <button
              onClick={handleShare}
              className="text-stone-600 hover:text-amber-900 flex items-center gap-1 text-xs border border-stone-200 px-3 py-1.5 rounded-lg bg-white"
            >
              <Share2 className="w-3.5 h-3.5" />
              اشتراک‌گذاری
            </button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 font-serif leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-light">
            {post.excerpt}
          </p>
        </header>

        {/* Hero image */}
        <div className="rounded-3xl overflow-hidden aspect-16/9 bg-stone-200 border border-stone-200 shadow-sm">
          <img
            src={post.coverImage || "/images/placeholder.jpg"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Body content */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-6 text-stone-800 leading-loose text-base sm:text-lg font-serif">
          <div className="whitespace-pre-line prose max-w-none">
            {post.content}
          </div>

          {/* Tags footer */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                برچسب‌ها:
              </span>
              {post.tags.map((t) => (
                <Link
                  key={t}
                  href={`/blog?tag=${t}`}
                  className="text-xs bg-stone-100 text-stone-700 hover:bg-amber-900 hover:text-white px-3 py-1 rounded-full transition"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="pt-4 flex justify-between items-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-900 hover:underline"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به فهرست مقالات
          </Link>
        </div>
      </div>
    </article>
  );
}
