import Link from "next/link";
import { ArrowLeft, Home, Sparkles } from "lucide-react";

const SITE_NAME = "Rootwood Group";

export const metadata = {
  title: "صفحه پیدا نشد | " + SITE_NAME,
  description: " الصفحه درخواستی در سایت روت‌وود گروه پیدا نشد. به صفحه اصلی مراجعه کنید.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-4 text-[var(--color-ink)]">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-error)]">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">صفحه پیدا نشد</h1>
          <p className="mt-3 text-lg text-[var(--color-ink-soft)]">
            الصفحه که دنبالش می‌گردید وجود ندارد یا حذف شده است.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/"
            className="btn btn-primary px-8 py-3 text-base"
          >
            <Home className="h-4 w-4 mr-2" /> بازگشت به صفحه اصلی
          </Link>
          <Link
            href="/products"
            className="btn btn-ghost px-8 py-3 text-base"
          >
            مشاهده محصولات <ArrowLeft className="h-4 w-4 ml-2" />
          </Link>
        </div>

        <div className="mt-12 border-t border-[var(--color-border)] pt-8">
          <h2 className="text-xl font-bold text-[var(--color-wood)] mb-6">دسته‌بندی‌های اصلی</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[ "میز", "نشیمن", "کتابخانه", "دکور" ].map((cat) => (
              <Link
                key={cat}
                href="/products"
                className="group block rounded-xl border border-[var(--color-border)] bg-white p-4 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
