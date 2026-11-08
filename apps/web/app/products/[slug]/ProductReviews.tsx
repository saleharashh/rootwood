"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import {
  createReview,
  getProductReviews,
  type RatingSummary,
  type Review,
} from "@/lib/api";
import { formatCount, formatDate } from "@/lib/price";
import { Star, MessageSquare } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
}

function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role={readonly ? undefined : "group"} aria-label={readonly ? undefined : "امتیاز شما"}>
      {Array.from({ length: 5 }).map((_, index) => (
        <button
          key={index}
          type="button"
          disabled={readonly}
          className={`rounded-md p-0.5 transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"}`}
          onClick={() => onChange?.(index + 1)}
          aria-label={readonly ? undefined : `امتیاز ${formatCount(index + 1)} ستاره`}
          aria-pressed={readonly ? undefined : value === index + 1}
        >
          <Star
            className={`h-5 w-5 ${
              index < value
                ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                : "fill-transparent text-[var(--color-border-strong)]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, productSlug }: ProductReviewsProps) {
  const { user, loading: authLoading } = useAuth();
  const { openAuth } = useStoreDialogs();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [data, setData] = useState<{
    rating: RatingSummary;
    reviews: Review[];
  } | null>(null);

  const productPath = `/products/${encodeURIComponent(productSlug)}`;

  const load = useCallback(() => {
    return getProductReviews(productId)
      .then((response) => {
        setData({ rating: response.rating, reviews: response.reviews });
        setLoadError(null);
      })
      .catch((loadFailure: unknown) => {
        setLoadError(
          loadFailure instanceof Error
            ? loadFailure.message
            : "بارگذاری نظرات ممکن نشد. دوباره تلاش کنید.",
        );
      })
      .finally(() => setLoadingReviews(false));
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const average = data?.rating.average ?? 0;
  const reviewCount = data?.rating.count ?? 0;
  const reviews = data?.reviews ?? [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      openAuth({ redirect: productPath });
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const response = await createReview(productId, null, {
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });
      setSuccess(
        response.approved
          ? "نظر شما ثبت شد."
          : "نظر شما پس از تأیید کارگاه نمایش داده می‌شود.",
      );
      setTitle("");
      setBody("");
      setRating(5);
      await load();
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ثبت نظر ممکن نشد. دوباره تلاش کنید.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-7 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--color-wood)]">
          <MessageSquare className="h-5 w-5 text-[var(--color-accent)]" />
          <span>دیدگاه‌ها و تجربیات خریداران</span>
        </h2>
        {reviewCount > 0 && (
          <span className="rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-0.5 text-xs font-semibold text-[var(--color-ink-soft)]">
            {formatCount(reviewCount)} نظر تأییدشده
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
        <div className="text-center">
          <div className="text-3xl font-extrabold text-[var(--color-wood)]">
            {average > 0 ? average.toLocaleString("fa-IR", { maximumFractionDigits: 1 }) : "—"}
          </div>
          <div className="text-xs font-medium text-[var(--color-ink-soft)]">{formatCount(reviewCount)} نظر</div>
        </div>
        <div className="flex-1">
          <div className="mb-2 text-xs font-medium text-[var(--color-ink-soft)]">
            {average > 0 ? `میانگین امتیاز رضایت: ${average.toLocaleString("fa-IR")} از ۵` : "هنوز دیدگاهی ثبت نشده است"}
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-stone-200"
            role="img"
            aria-label={`میانگین امتیاز ${average.toLocaleString("fa-IR")} از ۵`}
          >
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${average > 0 ? (average / 5) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {authLoading && <p className="mt-6 text-sm font-medium text-[var(--color-ink-soft)]">در حال بررسی ورود شما…</p>}

      {user && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5"
        >
          <h3 className="text-sm font-bold text-[var(--color-ink)]">ثبت تجربه خرید شما</h3>
          <div className="flex items-center gap-3">
            <StarRating value={rating} onChange={setRating} />
            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">{formatCount(rating)} از ۵ ستاره</span>
          </div>
          <div>
            <label htmlFor="review-title" className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">
              عنوان خلاصه <span className="text-[11px] font-medium text-[var(--color-ink-soft)]">(اختیاری)</span>
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="مثلاً: کیفیت رگه‌ها و پرداخت روغن عالی است"
              className="glass-input w-full rounded-xl px-3.5 py-2 text-sm text-[var(--color-ink)] outline-none"
            />
          </div>
          <div>
            <label htmlFor="review-body" className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">
              متن دیدگاه شما
            </label>
            <textarea
              id="review-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="درباره کیفیت چوب، اتصالات، حس لمس سطح روغن‌خورده و بسته‌بندی برای ما بنویسید…"
              rows={3}
              required
              minLength={2}
              maxLength={2000}
              className="glass-input w-full resize-y rounded-xl px-3.5 py-2 text-sm text-[var(--color-ink)] outline-none"
            />
          </div>
          {error && <p className="text-xs font-medium text-[var(--color-error)]" role="alert">{error}</p>}
          {success && <p className="text-xs font-medium text-[var(--color-success)]" role="status">{success}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting || body.trim().length < 2} className="btn btn-primary text-xs font-semibold">
              {submitting ? "در حال ثبت…" : "ارسال دیدگاه"}
            </button>
          </div>
        </form>
      )}

      {!authLoading && !user && (
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-center text-sm text-[var(--color-ink-soft)]">
          <p className="mb-3">برای ثبت دیدگاه و امتیاز، وارد حساب کاربری خود شوید.</p>
          <button
            type="button"
            onClick={() => openAuth({ redirect: productPath })}
            aria-haspopup="dialog"
            className="btn btn-primary text-xs"
          >
            ورود به حساب کاربری
          </button>
        </div>
      )}

      {loadError && (
        <div className="mt-6 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-4 text-sm text-[var(--color-error)]" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoadingReviews(true);
              void load();
            }}
            className="mt-2 cursor-pointer font-medium underline"
            disabled={loadingReviews}
          >
            {loadingReviews ? "در حال بارگذاری…" : "تلاش دوباره"}
          </button>
        </div>
      )}

      {loadingReviews && !data && !loadError && (
        <p className="mt-6 text-sm font-medium text-[var(--color-ink-soft)]">در حال بارگذاری دیدگاه‌ها…</p>
      )}

      {reviews.length > 0 && (
        <ul className="mt-6 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-wood)] text-xs font-bold text-white" aria-hidden="true">
                    {review.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[var(--color-ink)]">{review.user.name}</span>
                      <time dateTime={review.createdAt} className="text-xs font-medium text-[var(--color-ink-soft)]">
                        {formatDate(review.createdAt)}
                      </time>
                    </div>
                    <div className="mt-0.5 flex items-center gap-0.5" role="img" aria-label={`${formatCount(review.rating)} از ۵ ستاره`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-3.5 w-3.5 ${
                            index < review.rating
                              ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                              : "fill-transparent text-[var(--color-border-strong)]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.title && <span className="text-sm font-semibold text-[var(--color-ink)]">{review.title}</span>}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">{review.body}</p>
            </li>
          ))}
        </ul>
      )}

      {!loadingReviews && !loadError && reviews.length === 0 && (
        <p className="mt-5 text-center text-sm font-medium text-[var(--color-ink-soft)]">
          هنوز دیدگاهی ثبت نشده است — اولین نفری باشید که تجربه خود را با کارگاه به اشتراک می‌گذارد.
        </p>
      )}
    </div>
  );
}
