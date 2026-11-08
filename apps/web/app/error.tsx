"use client";

import Link from "next/link";
import { ArrowLeft, CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white px-6 py-14 text-center sm:px-12 sm:py-16 shadow-xs">
        <div className="relative">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-error)]/10 text-[var(--color-error)]"
            role="alert"
          >
            <CircleAlert className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
            مشکلی در بارگذاری صفحه رخ داده است
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
            ارتباط با سرور کارگاه به درستی برقرار نشد. لطفاً دوباره تلاش کنید یا به صفحه محصولات بازگردید.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="btn btn-primary text-sm font-semibold">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              تلاش مجدد
            </button>
            <Link href="/products" className="btn btn-ghost text-sm font-semibold">
              دیدن محصولات
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
