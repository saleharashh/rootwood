import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import {
  getBlogPostBySlug,
  type BlogPost,
} from "@/lib/api";
import { formatDate } from "@/lib/price";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

function getSiteUrl() {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    );
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBlogPostBySlug(slug).catch(() => null);
  if (!data) {
    return {
      title: "مقاله پیدا نشد",
      robots: { index: false, follow: false },
    };
  }

  const post = data.post;
  const canonical = `/blog/${post.slug}`;
  const images = post.coverUrl
    ? [{ url: post.coverUrl, alt: post.title }]
    : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "fa_IR",
      siteName: "کرفتدرات",
      title: post.title,
      description: post.excerpt,
      url: canonical,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.name] : undefined,
      tags: post.tags,
      images,
    },
    twitter: {
      card: post.coverUrl ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const data = await getBlogPostBySlug(slug).catch(() => null);

  if (!data) notFound();

  const post = data.post as BlogPost;
  const related = data.related as BlogPost[];
  const siteUrl = getSiteUrl();
  const postUrl = new URL(`/blog/${post.slug}`, siteUrl).toString();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverUrl
      ? [new URL(post.coverUrl, siteUrl).toString()]
      : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "fa-IR",
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    author: post.author
      ? { "@type": "Person", name: post.author.name }
      : { "@type": "Organization", name: "کرفتدرات" },
    publisher: { "@type": "Organization", name: "کرفتدرات" },
    keywords: post.tags.join("، "),
  };

  // Tailwind arbitrary variants provide article typography without the missing
  // @tailwindcss/typography plugin.
  const articleBodyClasses =
    "max-w-none text-base leading-relaxed text-[var(--color-ink-soft)] " +
    "[&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:leading-tight " +
    "[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-snug " +
    "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold " +
    "[&_h4]:mb-3 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold " +
    "[&_p]:my-5 [&_p]:leading-8 [&_strong]:font-semibold [&_strong]:text-[var(--color-ink)] " +
    "[&_em]:text-[var(--color-wood)] [&_a]:font-medium [&_a]:underline " +
    "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:ps-6 " +
    "[&_li]:my-2 [&_li]:ps-1 [&_li]:leading-8 [&_hr]:my-10 [&_hr]:border-white/45 " +
    "[&_blockquote]:my-8 [&_blockquote]:rounded-xl [&_blockquote]:border-e-4 [&_blockquote]:border-[var(--color-accent)] " +
    "[&_blockquote]:bg-white/35 [&_blockquote]:p-4 [&_blockquote]:italic [&_blockquote_p]:my-0 " +
    "[&_code]:rounded [&_code]:bg-white/45 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[var(--color-ink)] " +
    "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/50 [&_pre]:bg-white/40 [&_pre]:p-4 " +
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_img]:my-8 [&_img]:rounded-xl " +
    "[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-white/50 [&_th]:p-3 [&_th]:text-start [&_td]:border [&_td]:border-white/50 [&_td]:p-3";

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto w-full max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav
          aria-label="مسیر صفحه"
          className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-xs sm:text-sm text-[var(--color-ink-soft)] shadow-xs"
        >
          <Link
            href="/"
            className="rounded-md px-1.5 py-0.5 transition-colors hover:text-[var(--color-wood)]"
          >
            خانه
          </Link>
          <span aria-hidden className="text-[var(--color-border-strong)]">/</span>
          <Link
            href="/blog"
            className="rounded-md px-1.5 py-0.5 transition-colors hover:text-[var(--color-wood)]"
          >
            مجله
          </Link>
          <span aria-hidden className="text-[var(--color-border-strong)]">/</span>
          <span className="min-w-0 truncate font-semibold text-[var(--color-ink)]">
            {post.title}
          </span>
        </nav>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <article className="space-y-8">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
            }}
          />
          {/* Cover */}
          {post.coverUrl && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-2.5 shadow-xs">
              <div className="relative h-56 overflow-hidden rounded-xl sm:h-72 lg:h-96 bg-[var(--color-surface-2)]">
                <Image
                  src={post.coverUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 90vw"
                />
              </div>
            </div>
          )}

          {/* Header */}
          <header className="rounded-2xl border border-[var(--color-border)] bg-white px-6 py-8 sm:px-10 sm:py-10 shadow-xs">
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-soft)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-bold leading-tight text-[var(--color-wood)] sm:text-4xl lg:text-[2.5rem]">
                {post.title}
              </h1>
              <p className="text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
                {post.excerpt}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-xs sm:text-sm text-[var(--color-ink-soft)]">
                <div className="flex items-center gap-3">
                  {post.author && (
                    <>
                      <div
                        aria-hidden="true"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-wood)] text-xs font-bold text-white"
                      >
                        {post.author.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-[var(--color-ink)]">
                        {post.author.name}
                      </span>
                    </>
                  )}
                </div>
                <time
                  dateTime={post.publishedAt}
                  className="text-[var(--color-ink-mute)] font-medium"
                >
                  {formatDate(post.publishedAt)}
                </time>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="glass-card rounded-[28px] px-6 py-8 sm:px-10 sm:py-10">
            <div
              className={articleBodyClasses}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Author */}
          {post.author && (
            <div className="glass-soft flex items-start gap-4 rounded-[24px] p-5">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,var(--color-wood-light),var(--color-wood))] text-lg font-medium text-[var(--color-surface)]"
              >
                {post.author.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {post.author.name}
                </p>
                <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
                  نجار و سازنده در کرفتدرات.
                </p>
              </div>
            </div>
          )}
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14">
            <div className="glass-bar mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3">
              <h2 className="text-xl font-semibold text-[var(--color-wood)]">
                از مجله
              </h2>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-sm font-medium text-[var(--color-accent-strong)] transition-colors hover:bg-white/40 hover:text-[var(--color-wood)]"
              >
                دیدن همه
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="glass-card card-lift group flex flex-col rounded-[24px] p-2.5"
                >
                  {rp.coverUrl && (
                    <div className="glass-media relative aspect-[16/10] overflow-hidden rounded-2xl">
                      <Image
                        src={rp.coverUrl}
                        alt={rp.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--color-wood)] transition-colors group-hover:text-[var(--color-accent-strong)]">
                      {rp.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                      {rp.excerpt}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-xs text-[var(--color-ink-mute)]">
                      {(rp.tags || []).slice(0, 1).map((t) => (
                        <span key={t} className="glass-pill rounded-full px-2 py-0.5 text-[10px]">
                          {t}
                        </span>
                      ))}
                      <span>{formatDate(rp.publishedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
