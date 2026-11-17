import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Mail, MessageSquare, Phone, Star, Trash2, X } from "lucide-react";
import { api, type ContactMessage, type Review } from "@/lib/api";
import { CONTACT_STATUSES } from "@/lib/commerce";
import { formatJalaliDate, toPersianDigits } from "@/lib/price";
import { isSyntheticEmail } from "@/lib/validation";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { AdminCard, AdminSectionHeader, ConfirmDialog, LoadingBlock } from "./components";

type View = "reviews" | "messages";

export function Content() {
  const [view, setView] = useState<View>("reviews");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "PENDING" | "APPROVED">("PENDING");
  const [messageFilter, setMessageFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ kind: View; id: string; title: string } | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reviewResponse, messageResponse] = await Promise.all([
        api.getAdminReviews(),
        api.getAdminContacts(),
      ]);
      setReviews(reviewResponse.reviews || []);
      setMessages(messageResponse.messages || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در دریافت محتوا");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setApproval = async (review: Review, approved: boolean) => {
    setBusyId(review.id);
    try {
      await api.updateReviewApproval(review.id, approved);
      setReviews((current) =>
        current.map((item) => (item.id === review.id ? { ...item, approved } : item))
      );
      showToast(approved ? "دیدگاه منتشر شد" : "انتشار دیدگاه لغو شد", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در تغییر وضعیت دیدگاه", "error");
    } finally {
      setBusyId(null);
    }
  };

  const setContactStatus = async (message: ContactMessage, status: string) => {
    setBusyId(message.id);
    try {
      await api.updateContactStatus(message.id, status);
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? { ...item, status } : item))
      );
      showToast("وضعیت پیام تغییر کرد", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در تغییر وضعیت پیام", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!confirm) return;
    setBusyId(confirm.id);
    try {
      if (confirm.kind === "reviews") {
        await api.deleteReview(confirm.id);
        setReviews((current) => current.filter((item) => item.id !== confirm.id));
      } else {
        await api.deleteContact(confirm.id);
        setMessages((current) => current.filter((item) => item.id !== confirm.id));
      }
      showToast("مورد انتخاب‌شده حذف شد", "success");
      setConfirm(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در حذف", "error");
    } finally {
      setBusyId(null);
    }
  };

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "PENDING") return reviews.filter((review) => !review.approved);
    if (reviewFilter === "APPROVED") return reviews.filter((review) => review.approved);
    return reviews;
  }, [reviews, reviewFilter]);

  const filteredMessages = useMemo(() => {
    if (messageFilter === "ALL") return messages;
    return messages.filter((message) => message.status === messageFilter);
  }, [messages, messageFilter]);

  const pendingReviews = reviews.filter((review) => !review.approved).length;
  const openMessages = messages.filter((message) => message.status !== "RESOLVED").length;

  return (
    <AdminCard>
      <AdminSectionHeader
        title="محتوا"
        description="بازبینی دیدگاه‌های مشتریان و پیام‌های سفارش اختصاصی در یک جا"
      >
        <div className="flex rounded-xl border border-[var(--color-border)] p-0.5">
          <button
            type="button"
            onClick={() => setView("reviews")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              view === "reviews"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-ink-soft)]"
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            دیدگاه‌ها
            {pendingReviews > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
                {toPersianDigits(pendingReviews)}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setView("messages")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              view === "messages"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-ink-soft)]"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            پیام‌ها
            {openMessages > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 text-[10px]">
                {toPersianDigits(openMessages)}
              </span>
            )}
          </button>
        </div>
      </AdminSectionHeader>

      {error && <p className="py-8 text-center text-xs text-red-700">{error}</p>}

      {loading ? (
        <LoadingBlock />
      ) : view === "reviews" ? (
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["PENDING", `در انتظار تأیید (${toPersianDigits(pendingReviews)})`],
                ["APPROVED", `منتشرشده (${toPersianDigits(reviews.length - pendingReviews)})`],
                ["ALL", `همه (${toPersianDigits(reviews.length)})`],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={reviewFilter === value ? "default" : "outline"}
                onClick={() => setReviewFilter(value)}
                className="h-8 text-[11px]"
              >
                {label}
              </Button>
            ))}
          </div>

          {filteredReviews.length === 0 ? (
            <p className="py-12 text-center text-xs text-[var(--color-ink-muted)]">
              دیدگاهی در این وضعیت وجود ندارد.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink)]">
                        {review.authorName}
                        <span className="text-[10px] font-normal text-[var(--color-ink-muted)]">
                          {review.productName || "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${star <= review.rating ? "fill-current" : "text-stone-200"}`}
                          />
                        ))}
                        <span className="mr-1 text-[10px] text-[var(--color-ink-muted)]">
                          {formatJalaliDate(review.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        review.approved
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {review.approved ? "منتشرشده" : "در انتظار"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {review.comment}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={review.approved ? "outline" : "default"}
                      disabled={busyId === review.id}
                      onClick={() => setApproval(review, !review.approved)}
                      className="h-7 gap-1 px-2 text-[11px]"
                    >
                      {review.approved ? (
                        <>
                          <X className="h-3 w-3" />
                          لغو انتشار
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3" />
                          تأیید و انتشار
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === review.id}
                      onClick={() =>
                        setConfirm({ kind: "reviews", id: review.id, title: "حذف دیدگاه" })
                      }
                      className="h-7 gap-1 px-2 text-[11px] text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={messageFilter === "ALL" ? "default" : "outline"}
              onClick={() => setMessageFilter("ALL")}
              className="h-8 text-[11px]"
            >
              همه ({toPersianDigits(messages.length)})
            </Button>
            {Object.entries(CONTACT_STATUSES).map(([value, meta]) => (
              <Button
                key={value}
                size="sm"
                variant={messageFilter === value ? "default" : "outline"}
                onClick={() => setMessageFilter(value)}
                className="h-8 text-[11px]"
              >
                {meta.label} ({toPersianDigits(messages.filter((message) => message.status === value).length)})
              </Button>
            ))}
          </div>

          {filteredMessages.length === 0 ? (
            <p className="py-12 text-center text-xs text-[var(--color-ink-muted)]">
              پیامی در این وضعیت وجود ندارد.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-[var(--color-border-subtle)] bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink)]">
                        {message.name}
                        <StatusBadge status={message.status} kind="contact" />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-ink-muted)]">
                        {message.phone && (
                          <span className="flex items-center gap-1 font-mono" dir="ltr">
                            <Phone className="h-3 w-3" />
                            {message.phone}
                          </span>
                        )}
                        {!isSyntheticEmail(message.email) && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {message.email}
                          </span>
                        )}
                        <span>{formatJalaliDate(message.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-[var(--color-ink)]">
                    {message.subject}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    {message.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {Object.entries(CONTACT_STATUSES).map(([value, meta]) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={message.status === value ? "secondary" : "ghost"}
                        disabled={busyId === message.id || message.status === value}
                        onClick={() => setContactStatus(message, value)}
                        className="h-7 px-2 text-[11px]"
                      >
                        {meta.label}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === message.id}
                      onClick={() =>
                        setConfirm({ kind: "messages", id: message.id, title: "حذف پیام" })
                      }
                      className="h-7 gap-1 px-2 text-[11px] text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || "حذف"}
        description="این مورد برای همیشه حذف می‌شود و قابل بازگشت نیست."
        confirmLabel="حذف"
        busy={!!busyId}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--color-ink-muted)]">
        <MessageSquare className="h-3.5 w-3.5" />
        دیدگاه‌ها فقط پس از تأیید در صفحهٔ محصول نمایش داده می‌شوند.
      </div>
    </AdminCard>
  );
}
