import React from "react";
import { Link } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatPrice, toPersianDigits } from "@/lib/price";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet";

interface CartDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CartDialog({ open, onClose }: CartDialogProps) {
  const { cart, itemCount, subtotal, shipping, total, updateQuantity, removeItem } = useCart();
  const items = cart?.items || [];

  return (
    <Sheet open={open} onClose={onClose} side="left">
      <SheetHeader onClose={onClose}>
        <SheetTitle>
          سبد خرید {itemCount > 0 ? `(${toPersianDigits(itemCount)} کالا)` : ""}
        </SheetTitle>
      </SheetHeader>

      <SheetContent className="space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-[var(--color-ink)]">سبد خرید شما خالی است</p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              دست‌سازه‌های کارگاه را مرور کنید و اثر دلخواهتان را بیفزایید.
            </p>
            <Link href="/products" onClick={onClose}>
              <Button size="sm" className="mt-2">
                مشاهدهٔ کاتالوگ
              </Button>
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-3"
            >
              <img
                src={item.product.images?.[0]?.url || item.product.imageUrl || "/images/workshop.webp"}
                alt={item.product.title}
                className="h-20 w-20 shrink-0 rounded-xl border border-[var(--color-border)] object-cover"
              />

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={onClose}
                    className="line-clamp-1 text-sm font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                  >
                    {item.product.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-[var(--color-ink-muted)] hover:text-red-700"
                    aria-label="حذف از سبد"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-xs font-bold text-[var(--color-accent)]">
                  {formatPrice(item.product.price)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-[var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]"
                      aria-label="کاهش تعداد"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-bold text-[var(--color-ink)]">
                      {toPersianDigits(item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] disabled:opacity-30"
                      aria-label="افزایش تعداد"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] text-[var(--color-ink-muted)]">
                    جمع: {formatPrice(item.lineTotal)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </SheetContent>

      {items.length > 0 && (
        <SheetFooter className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
            <span>جمع اقلام</span>
            <span className="font-bold text-[var(--color-ink)]">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)]">
            <span>بسته‌بندی و ارسال</span>
            <span className="font-bold text-[var(--color-ink)]">
              {shipping === 0 ? "رایگان" : formatPrice(shipping)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-sm font-bold text-[var(--color-ink)]">
            <span>قابل پرداخت</span>
            <span className="text-base text-[var(--color-accent)]">{formatPrice(total)}</span>
          </div>

          <Link href="/checkout" onClick={onClose} className="block pt-1">
            <Button className="w-full gap-2">
              <span>ادامهٔ خرید و تکمیل مشخصات</span>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <Link
            href="/cart"
            onClick={onClose}
            className="block text-center text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-accent)]"
          >
            مشاهدهٔ کامل سبد خرید
          </Link>
        </SheetFooter>
      )}
    </Sheet>
  );
}
