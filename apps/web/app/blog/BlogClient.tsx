"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Search, SearchX, X } from "lucide-react";
import type { BlogPost } from "@/lib/api";
import { Spinner } from "@/components/loading";
import { formatDate } from "@/lib/price";

interface BlogClientProps {
  posts: BlogPost[];
  tags: string[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
}

export function BlogClient({
  posts,
  tags,
  total,
  page,
  pageSize,
  loading,
}: BlogClientProps) {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const params = new URLSearchParams(searchParams.toString());
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  function tagLink(t: string) {
    params.delete("tag");
    params.delete("page");
    if (t) params.set("tag", t);
    return `/blog?${params.toString()}`;
  }

  function clearSearch() {
    params.delete("q");
    params.delete("tag");
    params.delete("page");
    return `/blog?${params.toString()}`;
  }

  function pageLink(target: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    const query = next.toString();
    return `/blog${query ? `?${query}` : ""}`;
  }

  return (
    <>
      {/* Header */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white px-6 py-10 sm:px-12 sm:py-14 shadow-xs">
          <div className="relative max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)]">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              مجله تخصصی چوب و دکوراسیون
            </span>
            <h1 className="text-3xl font-bold text-[var(--color-wood)] sm:text-4xl lg:text-5xl tracking-tight">
              یادداشت‌های کارگاه و تجربه‌های ساخت
            </h1>
            <p className="text-base leading-relaxed text-[var(--color-ink-soft)]">
              {tag
                ? `نمایش مقالات دسته‌بندی «${tag}».`
                : q
                ? `نتیجه جستجو برای عبارت «${q}».`
                : "اندیشه‌ها، آموزش‌های مراقبت از چوب و روایات ساخت مبلمان دست‌ساز برای خانه‌ای صمیمی‌تر."}
            </p>

            {(tag || q) && (
              <div className="pt-2">
                <Link
                  href={clearSearch()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-strong)] transition-colors hover:bg-stone-200"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  حذف فیلترها و مشاهده همه
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tags */}
      <div className="sticky top-[4.75rem] z-20 mt-6">
        <div className="mx-auto flex max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur-md shadow-xs">
            <span className="text-xs font-bold text-[var(--color-ink-mute)]">
              موضوعات:
            </span>
            {tags.map((t) => (
              <Link
                key={t}
                href={tagLink(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  tag === t
                    ? "bg-[var(--color-wood)] text-white shadow-xs"
                    : "bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-wood)]"
                }`}
              >
                {t}
              </Link>
            ))}
            <form
              action="/blog"
              method="get"
              role="search"
              className="ms-auto flex items-center gap-1.5"
            >
              {tag && <input type="hidden" name="tag" value={tag} />}
              <label htmlFor="blog-search" className="sr-only">
                جستجوی مقالات
              </label>
              <input
                id="blog-search"
                type="search"
                name="q"
                defaultValue={q ?? ""}
                maxLength={80}
                placeholder="جستجو در مجله…"
                className="glass-input w-40 rounded-lg px-3 py-1.5 text-xs outline-none sm:w-52"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-wood)] px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
                جستجو
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Posts */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-mute)]">
              <SearchX className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-wood)]">
              مقاله‌ای با این مشخصات یافت نشد
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              می‌توانید موضوع یا عبارت دیگری را جستجو کنید.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Featured post */}
              {page === 1 && posts[0] && (
                <Link
                  href={`/blog/${posts[0].slug}`}
                  className="card-lift group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-2.5 transition-all shadow-xs"
                >
                  {posts[0].coverUrl && (
                    <div className="relative h-56 overflow-hidden rounded-xl sm:h-64 bg-[var(--color-surface-2)]">
                      <Image
                        src={posts[0].coverUrl}
                        alt={posts[0].title}
                        fill
                        priority
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      <span className="absolute start-3 top-3 rounded-md bg-[var(--color-wood)] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                        یادداشت برگزیده
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
                      {posts[0].tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-lg font-bold leading-snug text-[var(--color-wood)] transition-colors group-hover:text-[var(--color-accent)]">
                      {posts[0].title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-xs sm:text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {posts[0].excerpt}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-4 text-xs text-[var(--color-ink-mute)] border-t border-[var(--color-border)]">
                      <time dateTime={posts[0].publishedAt}>
                        {formatDate(posts[0].publishedAt)}
                      </time>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-accent-strong)]">
                        مطالعه متن کامل
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Side list */}
              <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
                {posts.slice(page === 1 ? 1 : 0).map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="card-lift group flex gap-3.5 rounded-2xl border border-[var(--color-border)] bg-white p-3 transition-all shadow-xs"
                  >
                    {post.coverUrl && (
                      <div className="relative w-28 shrink-0 self-stretch overflow-hidden rounded-xl bg-[var(--color-surface-2)]">
                        <Image
                          src={post.coverUrl}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 112px, 120px"
                        />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-mute)]">
                          {post.tags.slice(0, 2).map((t) => (
                            <span key={t} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink-soft)]">
                              {t}
                            </span>
                          ))}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--color-wood)] transition-colors group-hover:text-[var(--color-accent)]">
                          {post.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-ink-mute)] pt-2 border-t border-[var(--color-border)]">
                        <time dateTime={post.publishedAt}>
                          {formatDate(post.publishedAt)}
                        </time>
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent-strong)] transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 pb-12 sm:px-6 lg:px-8"
          aria-label="صفحه‌بندی مقالات"
        >
          {page > 1 ? (
            <Link href={pageLink(page - 1)} className="btn btn-ghost text-sm" rel="prev">
              صفحه قبل
            </Link>
          ) : (
            <span className="btn btn-ghost cursor-not-allowed text-sm opacity-50" aria-disabled="true">
              صفحه قبل
            </span>
          )}
          <span className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-xs">
            صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
          </span>
          {page < totalPages ? (
            <Link href={pageLink(page + 1)} className="btn btn-ghost text-sm" rel="next">
              صفحه بعد
            </Link>
          ) : (
            <span className="btn btn-ghost cursor-not-allowed text-sm opacity-50" aria-disabled="true">
              صفحه بعد
            </span>
          )}
        </nav>
      )}
    </>
  );
}
