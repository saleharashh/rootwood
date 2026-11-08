export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">در حال بارگذاری اطلاعات…</span>
      <div className="animate-pulse space-y-8" aria-hidden="true">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xs">
          <div className="h-5 w-24 rounded-full bg-stone-200" />
          <div className="mt-4 h-9 max-w-md rounded-xl bg-stone-200" />
          <div className="mt-3 h-4 max-w-xl rounded-md bg-stone-100" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-xs">
              <div className="h-44 rounded-xl bg-stone-100" />
              <div className="mt-4 space-y-2 p-1">
                <div className="h-4 w-3/4 rounded-md bg-stone-200" />
                <div className="h-3 w-1/2 rounded-md bg-stone-100" />
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                  <div className="h-5 w-20 rounded-md bg-stone-200" />
                  <div className="h-8 w-20 rounded-lg bg-stone-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
