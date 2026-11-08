"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, ArrowLeft, RotateCw } from "lucide-react";
import { Spinner } from "@/components/loading";
import { verifyPayment, type VerifyPaymentResult } from "@/lib/api";
import { formatPrice } from "@/lib/price";

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const rawGateway = searchParams.get("gateway");
  const authority = searchParams.get("Authority");
  const trackId = searchParams.get("trackId") || authority || "";
  const gateway = rawGateway || (authority ? "zarinpal" : "zibal");
  const status = searchParams.get("Status") || searchParams.get("status") || undefined;
  const success = searchParams.get("success") || undefined;

  const [loading, setLoading] = useState(Boolean(trackId));
  const [result, setResult] = useState<VerifyPaymentResult | null>(
    trackId
      ? null
      : {
          success: false,
          errorMessage: "اطلاعات بازگشتی از درگاه پرداخت ناقص یا نامعتبر است.",
        },
  );

  useEffect(() => {
    if (!trackId) return;

    let cancelled = false;

    verifyPayment({
      gateway,
      trackId,
      status,
      success,
    })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            success: false,
            errorMessage:
              err instanceof Error
                ? err.message
                : "خطایی در فرآیند استعلام و تایید پرداخت رخ داد.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gateway, trackId, status, success]);

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="glass-card rounded-[28px] p-10 border border-[var(--color-border)] shadow-xs">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-[var(--color-accent)] border border-amber-200">
            <RotateCw className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-wood)]">
            در حال اعتبارسنجی پرداخت بانکی...
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            لطفاً چند لحظه صبر نمایید تا تراکنش شما از شاپرک استعلام گردد.
          </p>
        </div>
      </div>
    );
  }

  if (!result || !result.success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <div className="glass-card rounded-[28px] p-8 sm:p-10 border border-rose-200 bg-white shadow-xs">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <CircleAlert className="h-8 w-8" />
          </div>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-900">
            پرداخت ناموفق
          </span>
          <h1 className="mt-3 text-2xl font-bold text-[var(--color-wood)]">
            تراکنش انجام نشد
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
            {result?.errorMessage || "پرداخت در درگاه بانکی تایید نگردید یا توسط کاربر لغو شد."}
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-mute)]">
            اگر مبلغی از حساب شما کسر شده است، ظرف حداکثر ۷۲ ساعت توسط بانک به حسابتان عودت داده می‌شود.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/checkout" className="btn btn-primary">
              تلاش مجدد در تسویه حساب
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/account" className="btn btn-ghost">
              سفارش‌های من
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div className="glass-card rounded-[28px] p-8 sm:p-10 border border-emerald-200 bg-white shadow-xs">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
          پرداخت موفق و تاییدشده
        </span>
        <h1 className="mt-3 text-2xl font-bold text-[var(--color-wood)]">
          با تشکر، سفارش شما پرداخت شد
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          رسید دیجیتالی شما در زیر ثبت شده و سفارش جهت آماده‌سازی به کارگاه تحویل داده شد.
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-start text-sm space-y-2.5">
          {result.orderNumber && (
            <div className="flex justify-between">
              <span className="text-[var(--color-ink-soft)]">شماره سفارش:</span>
              <span className="font-mono font-bold text-[var(--color-wood)]">{result.orderNumber}</span>
            </div>
          )}
          {result.refId && (
            <div className="flex justify-between">
              <span className="text-[var(--color-ink-soft)]">کد پیگیری تراکنش (Ref ID):</span>
              <span className="font-mono font-bold text-[var(--color-accent-strong)]">{result.refId}</span>
            </div>
          )}
          {result.cardPan && (
            <div className="flex justify-between">
              <span className="text-[var(--color-ink-soft)]">شماره کارت:</span>
              <span className="font-mono text-[var(--color-ink)]" dir="ltr">{result.cardPan}</span>
            </div>
          )}
          {result.amount && (
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
              <span className="font-medium text-[var(--color-ink)]">مبلغ پرداختی:</span>
              <span className="font-bold text-[var(--color-wood)]">{formatPrice(result.amount)}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {result.orderId && (
            <Link href={`/order-confirmation?id=${result.orderId}`} className="btn btn-primary">
              مشاهده وضعیت فاکتور
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <Link href="/products" className="btn btn-ghost">
            ادامه خرید از مجموعه
          </Link>
        </div>
      </div>
    </div>
  );
}
