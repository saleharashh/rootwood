"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Dialog } from "@/components/dialog";
import { Spinner } from "@/components/loading";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { formatPrice } from "@/lib/price";

interface CartDialogProps {
  open: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
}

function faCount(value: number) {
  return value.toLocaleString("fa-IR");
}

export function CartDialog({ open, onClose, onRequireAuth }: CartDialogProps) {
  const { cart, loading, refreshing, error, loadCart, removeItem, updateItem, clear } =
    useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  async function mutate(operation: () => Promise<void>, successMessage?: string) {
    try {
      await operation();
      if (successMessage) toast(successMessage, "info");
    } catch (mutationError: unknown) {
      toast(
        mutationError instanceof Error
          ? mutationError.message
          : "تغییر سبد خرید ممکن نشد",
        "error",
      );
    }
  }

  const items = cart?.items ?? [];
  const itemCount = cart?.summary.itemCount ?? 0;
  const empty = items.length === 0;
  const remainingForFreeShipping = cart
    ? Math.max(0, cart.summary.freeShippingThreshold - cart.summary.subtotal)
    : 0;
  const freeShippingProgress = cart
    ? Math.min(100, (cart.summary.subtotal / cart.summary.freeShippingThreshold) * 100)
    : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-wood)]">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <span>سبد خرید شما</span>
          {itemCount > 0 && (
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink-soft)]">
              {faCount(itemCount)} کالا
            </span>
          )}
        </>
      }
      footer={
        !loading && !error && !empty && cart ? (
          <div className="space-y-3.5">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--color-ink-soft)]">مجموع اقلام چوبی</dt>
                <dd className="font-semibold text-[var(--color-ink)]">
                  {formatPrice(cart.summary.subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--color-ink-soft)]">هزینه ارسال امن با بسته‌بندی ویژه</dt>
                <dd
                  className={`font-semibold ${
                    cart.summary.shipping === 0
                      ? "text-[var(--color-success)]"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  {cart.summary.shipping === 0
                    ? "رایگان"
                    : formatPrice(cart.summary.shipping)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2.5">
                <dt className="font-bold text-[var(--color-ink)]">مبلغ نهایی قابل پرداخت</dt>
                <dd className="text-xl font-extrabold text-[var(--color-wood)]">
                  {formatPrice(cart.summary.total)}
                </dd>
              </div>
            </dl>

            {cart.summary.shipping > 0 && (
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                <p className="mb-2 text-xs text-[var(--color-ink-soft)]">
                  تنها{" "}
                  <span className="font-bold text-[var(--color-accent-strong)]">
                    {formatPrice(remainingForFreeShipping)}
                  </span>{" "}
                  تا ارسال کاملاً رایگان سفارش شما باقی مانده است.
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {user ? (
              <Link
                href="/checkout"
                onClick={onClose}
                className="btn btn-primary w-full text-base py-3"
              >
                تکمیل اطلاعات و ثبت نهایی سفارش
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onRequireAuth}
                className="btn btn-primary w-full cursor-pointer text-base py-3"
              >
                برای تکمیل خرید وارد حساب شوید
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <p className="text-center text-[11px] text-[var(--color-ink-mute)]">
              ضمانت بازگشت در صورت عدم تطابق با سفارش · ساخت دست‌ساز در کارگاه نجاری
            </p>
          </div>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
          <button
            type="button"
            onClick={() => void loadCart()}
            className="btn btn-primary mt-4 cursor-pointer"
          >
            تلاش دوباره
          </button>
        </div>
      ) : empty || !cart ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-ink-mute)]">
            <ShoppingBag className="h-8 w-8 opacity-60" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-wood)]">
            سبد خرید شما خالی است
          </h3>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            هنوز قطعه‌ای از کارگاه به سبد خرید خود اضافه نکرده‌اید.
          </p>
          <Link
            href="/products"
            onClick={onClose}
            className="btn btn-primary mt-6 text-sm"
          >
            مشاهده مجموعه محصولات
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3.5 rounded-xl border border-[var(--color-border)] bg-white p-3.5 shadow-xs"
            >
              <Link
                href={`/products/${item.product.slug}`}
                onClick={onClose}
                className="relative h-22 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface-2)]"
              >
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--color-ink-mute)]">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={onClose}
                      className="block truncate text-sm font-bold text-[var(--color-ink)] hover:text-[var(--color-wood)]"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void mutate(
                        () => removeItem(item.id),
                        "کالا از سبد خرید حذف شد",
                      )
                    }
                    disabled={refreshing}
                    className="cursor-pointer p-1 text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-error)] disabled:opacity-40"
                    aria-label={`حذف ${item.product.name} از سبد خرید`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div className="flex items-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    <button
                      type="button"
                      onClick={() =>
                        void mutate(() =>
                          updateItem(item.id, Math.max(1, item.quantity - 1)),
                        )
                      }
                      disabled={refreshing || item.quantity <= 1}
                      className="cursor-pointer px-2.5 py-1 text-[var(--color-ink-soft)] transition-colors hover:bg-white hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="کاهش تعداد"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-8 px-2 py-1 text-center text-xs font-bold text-[var(--color-ink)]">
                      {faCount(item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void mutate(() => updateItem(item.id, item.quantity + 1))
                      }
                      disabled={refreshing || item.quantity >= item.product.stock}
                      className="cursor-pointer px-2.5 py-1 text-[var(--color-ink-soft)] transition-colors hover:bg-white hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="افزایش تعداد"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-[var(--color-wood)]">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => void mutate(clear, "سبد خرید خالی شد")}
              disabled={refreshing}
              className="cursor-pointer text-xs text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-error)] disabled:opacity-40"
            >
              خالی کردن سبد خرید
            </button>
            <Link
              href="/products"
              onClick={onClose}
              className="text-xs font-bold text-[var(--color-accent-strong)] hover:underline"
            >
              افزودن محصولات دیگر ←
            </Link>
          </div>
        </div>
      )}
    </Dialog>
  );
}
