import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPriceToman, toPersianDigits } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PriceSummary } from "@/components/price-summary";

export function CartPage() {
  const {
    cart,
    updateQuantity,
    removeItem,
    clearCart,
    loading,
    initialLoading,
    subtotal,
    shipping,
    total,
    freeShippingThreshold,
  } = useCart();

  const items = cart?.items || [];
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(
    100,
    Math.round((subtotal / Math.max(freeShippingThreshold, 1)) * 100)
  );

  if (initialLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)]/20 border-t-[var(--color-accent)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="سبد خرید شما خالی است"
          description="هنوز اثری به سبد خرید اضافه نکرده‌اید. کاتالوگ دست‌سازه‌های چوبی کارگاه را ببینید."
          action={
            <Link href="/products">
              <Button className="gap-2">
                مشاهدهٔ کاتالوگ آثار
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] pb-16">
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-[var(--color-ink-muted)] sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-accent)]">
              خانه
            </Link>
            <span>/</span>
            <span className="font-medium text-[var(--color-ink)]">سبد خرید</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-ink)] font-serif">
              سبد خرید
            </h1>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {toPersianDigits(items.length)} عنوان کالا در سبد شما
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)] transition hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            خالی کردن سبد
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium text-[var(--color-ink-soft)]">
                  <Truck className="h-4 w-4 text-[var(--color-accent)]" />
                  {remainingForFreeShipping > 0 ? (
                    <>
                      با افزودن{" "}
                      <strong className="text-[var(--color-accent)]">
                        {formatPriceToman(remainingForFreeShipping)}
                      </strong>{" "}
                      دیگر ارسال رایگان می‌شود
                    </>
                  ) : (
                    <span className="font-bold text-[var(--color-success)]">
                      ارسال این سفارش رایگان است
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-[var(--color-ink-muted)]">
                  {toPersianDigits(freeShippingPercent)}٪
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${freeShippingPercent}%` }}
                />
              </div>
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] sm:h-24 sm:w-24"
                  >
                    <img
                      src={item.product.imageUrl || "/images/workshop.webp"}
                      alt={item.product.title}
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </Link>

                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="line-clamp-1 font-serif text-base font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                    >
                      {item.product.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
                      <span>{item.product.woodType || "چوب طبیعی"}</span>
                      {item.product.category?.name && (
                        <>
                          <span>•</span>
                          <span>{item.product.category.name}</span>
                        </>
                      )}
                    </div>
                    <div className="pt-1 text-sm font-bold text-[var(--color-accent)]">
                      {formatPriceToman(item.product.price)}
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] pt-3 sm:w-auto sm:justify-end sm:border-0 sm:pt-0">
                    <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={loading}
                        aria-label="کاهش تعداد"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-white disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-[var(--color-ink)]">
                        {toPersianDigits(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading || item.quantity >= item.product.stock}
                        aria-label="افزایش تعداد"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-white disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="min-w-[90px] text-left text-sm font-extrabold text-[var(--color-ink)]">
                      {formatPriceToman(item.product.price * item.quantity)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={loading}
                      aria-label="حذف از سبد"
                      className="rounded-lg p-2 text-[var(--color-ink-muted)] transition hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
            >
              <ArrowRight className="h-4 w-4" />
              ادامهٔ خرید
            </Link>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="border-b border-[var(--color-border-subtle)] pb-3 font-serif text-lg font-bold text-[var(--color-ink)]">
                خلاصهٔ سفارش
              </h2>

              <PriceSummary subtotal={subtotal} shipping={shipping} total={total} />

              <Link href="/checkout" className="block">
                <Button className="w-full gap-2">
                  تکمیل مشخصات و ثبت سفارش
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>

              <p className="text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                پس از ثبت سفارش، کد پیگیری نمایش داده می‌شود و هماهنگی پرداخت از طریق ایتا انجام
                می‌گیرد.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
