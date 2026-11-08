import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Calendar, Clock, Search, Tag } from "lucide-react";
import { api, type BlogPost } from "@/lib/api";
import { formatJalaliDate, toPersianDigits } from "@/lib/price";

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const [postsRes, tagsRes] = await Promise.all([
          api.getBlogPosts({ tag: selectedTag || undefined, search: search || undefined }),
          api.getBlogTags(),
        ]);
        if (isMounted) {
          setPosts(postsRes.posts || []);
          setTags(tagsRes.tags || []);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [selectedTag, search]);

  return (
    <div className="bg-stone-50/50 min-h-[80vh] pb-20">
      {/* Hero header */}
      <div className="bg-stone-900 text-stone-100 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
            مجله و دانشنامه هنر چوب
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif">
            روایت ریشه‌ها و رازهای دست‌سازه‌های چوبی
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            مقالات تخصصی درباره گونه‌های بومی چوب ایران، تکنیک‌های اتصالات نجاری سنتی، روغن‌های گیاهی و راهنمای چیدمان دکوراسیون ماندگار.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو در مقالات و راهنماهای چوب..."
                className="w-full bg-stone-800 text-stone-100 placeholder-stone-400 text-xs sm:text-sm pl-4 pr-10 py-3 rounded-2xl border border-stone-700 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Tags filter */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
            <span className="text-xs font-semibold text-stone-500 shrink-0 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              موضوعات:
            </span>
            <button
              onClick={() => setSelectedTag("")}
              className={`text-xs px-3 py-1.5 rounded-full transition shrink-0 ${
                selectedTag === ""
                  ? "bg-amber-900 text-white font-semibold"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
              }`}
            >
              همه نوشته‌ها
            </button>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t === selectedTag ? "" : t)}
                className={`text-xs px-3 py-1.5 rounded-full transition shrink-0 ${
                  selectedTag === t
                    ? "bg-amber-900 text-white font-semibold"
                    : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Posts grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 max-w-md mx-auto">
            <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-bold text-stone-800">مقاله‌ای یافت نشد</h3>
            <p className="text-xs text-stone-500">موردی متناسب با فیلتر یا جستجوی انتخابی شما پیدا نشد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col group"
              >
                <Link href={`/blog/${post.slug}`} className="aspect-16/10 overflow-hidden bg-stone-100 block">
                  <img
                    src={post.coverImage || "/images/placeholder.jpg"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </Link>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatJalaliDate(post.publishedAt || post.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {toPersianDigits(post.readingTimeMinutes || 5)} دقیقه مطالعه
                      </span>
                    </div>

                    <Link href={`/blog/${post.slug}`} className="block">
                      <h2 className="text-lg font-bold text-stone-900 font-serif group-hover:text-amber-900 transition line-clamp-2 leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">نگارش: {post.authorName}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-bold text-amber-900 group-hover:underline flex items-center gap-1"
                    >
                      ادامه مطلب ←
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
