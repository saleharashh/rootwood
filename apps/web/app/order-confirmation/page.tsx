"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, Package } from "lucide-react";
import { Spinner } from "@/components/loading";
import { useAuth } from "@/components/auth-provider";
import { getOrder, type Order } from "@/lib/api";
import { formatCount, formatDate, formatPrice } from "@/lib/price";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "سفارش ثبت شد",
  PAID: "پرداخت انجام شد",
  SHIPPED: "در حال ارسال",
  DELIVERED: "تحویل داده شد",
  CANCELLED: "لغو شد",
};

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <OrderConfirmation />
    </Suspense>
  );
}

function OrderConfirmation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const destination = id ? `/order-confirmation?id=${encodeURIComponent(id)}` : "/account";
      router.replace(`/signin?redirect=${encodeURIComponent(destination)}`);
      return;
    }
    if (!id) return;

    let cancelled = false;
    getOrder(null, id)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading, router]);

  if (loading || authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="glass-card rounded-[28px] p-10">
          <div className="glass-pill mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-[var(--color-ink-mute)]">
            <CircleAlert className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-wood)]">
            این سفارش را نتوانستیم پیدا کنیم
          </h1>
          <p className="mt-2 leading-relaxed text-[var(--color-ink-soft)]">
            با همان حسابی که سفارش را ثبت کرده وارد شوید، یا تاریخچه سفارش‌های
            خود را در صفحه حساب کاربری ببینید.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/account" className="btn btn-primary">
              سفارش‌های من
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/products" className="btn btn-ghost">
              ادامه خرید
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const address = (order.shippingAddress ?? {}) as Record<string, string | undefined>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white px-6 py-10 text-center sm:px-10 shadow-xs">
        <div className="relative">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <span className="inline-block rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)]">
            با تشکر از اعتماد شما
          </span>
          <h1 className="mt-3 text-3xl font-bold text-[var(--color-wood)]">
            سفارش شما با موفقیت ثبت شد
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            تیم کارگاه نجاری کرفتدرات ساخت و آماده‌سازی قطعات شما را آغاز خواهد کرد.
          </p>
        </div>
      </div>

      <div className="glass-card mt-6 grid grid-cols-1 gap-3 rounded-[26px] p-5 sm:grid-cols-2">
        <div className="glass-inset rounded-2xl p-4">
          <p className="text-sm font-medium text-[var(--color-ink-soft)]">شماره سفارش</p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-wood)]" dir="ltr">
            {order.orderNumber}
          </p>
        </div>
        <div className="glass-inset rounded-2xl p-4">
          <p className="text-sm font-medium text-[var(--color-ink-soft)]">وضعیت</p>
          <p className="mt-1 flex items-center gap-2 font-medium text-[var(--color-success)]">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-current" />
            {STATUS_LABEL[order.status] ?? order.status}
          </p>
        </div>
        {order.paymentRefId && (
          <div className="glass-inset rounded-2xl p-4">
            <p className="text-sm font-medium text-[var(--color-ink-soft)]">کد رهگیری پرداخت بانکی</p>
            <p className="mt-1 font-mono font-bold text-[var(--color-accent-strong)]" dir="ltr">
              {order.paymentRefId}
            </p>
          </div>
        )}
        {order.paymentGateway && (
          <div className="glass-inset rounded-2xl p-4">
            <p className="text-sm font-medium text-[var(--color-ink-soft)]">درگاه پرداخت</p>
            <p className="mt-1 font-semibold text-[var(--color-wood)]">
              {order.paymentGateway === "zarinpal" ? "زرین‌پال" : order.paymentGateway === "zibal" ? "زیبال" : order.paymentGateway}
            </p>
          </div>
        )}
        <div className="glass-inset rounded-2xl p-4 sm:col-span-2">
          <p className="text-sm font-medium text-[var(--color-ink-soft)]">تاریخ ثبت</p>
          <p className="mt-1 font-medium text-[var(--color-ink)]">
            {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="glass-card mt-6 rounded-[26px] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-wood)]">
          جزئیات سفارش
        </h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="glass-inset flex gap-4 rounded-2xl p-3">
              <div className="glass-media relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)]">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--color-ink-soft)]">
                    <Package className="h-5 w-5" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[var(--color-ink-soft)]">
                  {formatCount(item.quantity)} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-[var(--color-wood)]">
                {formatPrice(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-[var(--color-ink-soft)]">جمع کالاها</dt>
            <dd className="font-medium text-[var(--color-ink)]">
              {formatPrice(order.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[var(--color-ink-soft)]">هزینه ارسال</dt>
            <dd className="font-medium text-[var(--color-ink)]">
              {order.shipping === 0 ? "رایگان" : formatPrice(order.shipping)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2">
            <dt className="font-semibold text-[var(--color-ink)]">مبلغ کل</dt>
            <dd className="text-lg font-semibold text-[var(--color-wood)]">
              {formatPrice(order.total)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Delivery */}
      <div className="glass-card mt-6 rounded-[26px] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-wood)]">
          نشانی تحویل
        </h2>
        <address className="glass-inset mt-3 rounded-2xl p-4 text-sm not-italic leading-relaxed text-[var(--color-ink-soft)] font-medium">
          {address.fullName ? <div>{address.fullName}</div> : null}
          {address.line1 ? <div>{address.line1}</div> : null}
          {address.line2 ? <div>{address.line2}</div> : null}
          <div>
            {[address.city, address.state, address.postalCode]
              .filter(Boolean)
              .join("، ")}
          </div>
          {address.country ? <div>{address.country}</div> : null}
          {address.phone ? <div dir="ltr">{address.phone}</div> : null}
        </address>
        {order.note ? (
          <p className="mt-3 text-sm font-medium text-[var(--color-ink-soft)]">
            یادداشت: {order.note}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account" className="btn btn-primary">
          سفارش‌های من
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/products" className="btn btn-ghost">
          ادامه خرید
        </Link>
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-[var(--color-ink-soft)]">
        اگر پیش از آماده‌سازی سفارش به نکته‌ای نیاز باشد، خودمان تماس می‌گیریم.
        برای پرسش‌ها به{" "}
        <a href="mailto:hello@craftedroot.com" className="font-semibold text-[var(--color-wood)] underline underline-offset-2 hover:text-[var(--color-accent-strong)]">
          hello@craftedroot.com
        </a>{" "}
        ایمیل بزنید.
      </p>
    </div>
  );
}
