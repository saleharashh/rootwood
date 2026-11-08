import { clsx } from "clsx";

export function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  return (
    <svg
      className={clsx(sizeMap[size], className, "animate-spin text-[var(--color-wood)]")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8"
      />
    </svg>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-xs">
          <div className="aspect-[4/3] rounded-xl bg-stone-100 animate-pulse" />
          <div className="mt-4 space-y-2.5 p-1">
            <div className="h-4 w-3/4 rounded-md bg-stone-200/80 animate-pulse" />
            <div className="h-3 w-1/2 rounded-md bg-stone-100 animate-pulse" />
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
              <div className="h-5 w-20 rounded-md bg-stone-200 animate-pulse" />
              <div className="h-8 w-20 rounded-lg bg-stone-200/80 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6 animate-pulse shadow-xs">
        <div className="h-8 w-48 rounded-lg bg-stone-200" />
        <div className="h-4 w-72 rounded-md bg-stone-100" />
      </div>
      <ProductGridSkeleton />
    </div>
  );
}
