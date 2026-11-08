import React from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Truck } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/lib/price";
import { Link } from "wouter";

interface CartDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CartDialog({ open, onClose }: CartDialogProps) {
  const { cart, itemCount, subtotal, shipping, total, updateQuantity, removeItem } = useCart();

  if (!open) return null;

  const freeThreshold = 5000000;
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const remainingForFree = Math.max(0, freeThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        role="dialog"
        aria-label="سبد خرید"
        aria-modal="true"
        className="absolute inset-y-0 left-0 max-w-full flex pl-0"
      >
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-r border-[var(--color-border)] animate-in slide-in-from-left duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-wood)]">
                سبد خرید ({itemCount} کالا)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[var(--color-ink-mute)] hover:bg-[var(--color-surface-2)]"
              aria-label="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free shipping bar */}
          <div className="bg-[var(--color-surface-2)] px-6 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink-soft)] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[var(--color-accent)]" />
                {subtotal >= freeThreshold ? (
                  <span className="text-[var(--color-success)] font-bold">
                    سفارش شما شامل ارسال رایگان است!
                  </span>
                ) : (
                  <span>
                    {formatPrice(remainingForFree)} تا ارسال رایگان سراسری
                  </span>
                )}
              </span>
              <span>{progressPercent}٪</span>
            </div>
            <div className="w-full bg-[var(--color-border)] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[var(--color-accent)] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4 text-[var(--color-ink-mute)]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-[var(--color-wood)] text-base">
                  سبد خرید شما در حال حاضر خالی است
                </h3>
                <p className="text-xs text-[var(--color-ink-mute)] mt-1.5 mb-6">
                  مبلمان و اکسسوری‌های دست‌ساز کارگاه را مرور فرمایید.
                </p>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="btn btn-primary text-xs font-bold"
                >
                  مشاهده کاتالوگ محصولات
                </Link>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3.5 rounded-2xl border border-[var(--color-border)] bg-white/70 shadow-2xs"
                >
                  <img
                    src={item.product.images?.[0]?.url || item.product.imageUrl || "/images/workshop.webp"}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover border border-[var(--color-border)] bg-[var(--color-surface-2)] shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={onClose}
                          className="font-bold text-sm text-[var(--color-wood)] hover:text-[var(--color-accent)] line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[var(--color-ink-mute)] hover:text-red-600 p-1"
                          aria-label="حذف از سبد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs font-bold text-[var(--color-accent-strong)] mt-1">
                        {formatPrice(item.product.price)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[var(--color-border)] rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-[var(--color-surface-2)] rounded-r-lg text-[var(--color-ink-soft)]"
                          aria-label="کاهش تعداد"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[var(--color-ink)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="p-1 hover:bg-[var(--color-surface-2)] rounded-l-lg text-[var(--color-ink-soft)] disabled:opacity-30"
                          aria-label="افزایش تعداد"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
                        مجموع: {formatPrice(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                <span>جمع اقلام:</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
                <span>هزینه بسته‌بندی و ارسال:</span>
                <span className="font-bold">
                  {shipping === 0 ? "رایگان (پالت چوبی)" : formatPrice(shipping)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-[var(--color-wood)] pt-2 border-t border-[var(--color-border)]">
                <span>مبلغ قابل پرداخت:</span>
                <span className="text-base text-[var(--color-accent-strong)]">
                  {formatPrice(total)}
                </span>
              </div>

              <div className="pt-2">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <span>ادامه و ثبت سفارش</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
