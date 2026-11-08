"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import type { Product } from "@/lib/api";

interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
  compact?: boolean;
}

export function AddToCartButton({
  product,
  disabled = false,
  compact = false,
}: AddToCartButtonProps) {
  const { addItem, refreshing } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "added">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function changeQuantity(next: number) {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("idle");
    setQty(Math.max(1, Math.min(product.stock, next)));
  }

  if (disabled || product.stock === 0) {
    return (
      <button
        type="button"
        disabled
        className="btn cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs sm:text-sm font-semibold text-[var(--color-ink-soft)] opacity-70"
      >
        ناموجود
      </button>
    );
  }

  async function handleAdd() {
    if (refreshing) return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setStatus("idle");
    try {
      await addItem(product.id, qty);
      setStatus("added");
      toast(`${qty.toLocaleString("fa-IR")} عدد «${product.name}» به سبد خرید اضافه شد`, "success");
      resetTimer.current = setTimeout(() => {
        setStatus("idle");
        resetTimer.current = null;
      }, 1800);
    } catch (error) {
      setStatus("idle");
      toast(
        error instanceof Error
          ? error.message
          : "افزودن به سبد خرید ممکن نشد. دوباره تلاش کنید.",
        "error",
      );
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={refreshing}
        aria-label={`افزودن ${product.name} به سبد خرید`}
        className={`btn h-10 shrink-0 px-4 text-xs font-bold shadow-xs active:scale-95 transition-all ${
          status === "added"
            ? "bg-[var(--color-success)] text-white border-transparent"
            : "btn-primary"
        }`}
      >
        {status === "added" ? (
          <>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            <span>اضافه شد</span>
          </>
        ) : (
          <>
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>افزودن به سبد</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xs"
        role="group"
        aria-label="تعداد محصول"
      >
        <button
          type="button"
          onClick={() => changeQuantity(qty - 1)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="کاهش تعداد"
          disabled={qty <= 1}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span
          className="flex h-11 min-w-11 items-center justify-center border-x border-[var(--color-border)] px-3 text-sm font-bold text-[var(--color-ink)]"
          aria-live="polite"
        >
          {qty.toLocaleString("fa-IR")}
        </span>
        <button
          type="button"
          onClick={() => changeQuantity(qty + 1)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="افزایش تعداد"
          disabled={qty >= product.stock}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={refreshing}
        aria-label={`افزودن ${qty.toLocaleString("fa-IR")} عدد ${product.name} به سبد خرید`}
        className={`btn h-11 shrink-0 px-6 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
          status === "added"
            ? "bg-[var(--color-success)] text-white hover:bg-[var(--color-success)] border-transparent"
            : "btn-primary"
        }`}
      >
        {refreshing ? (
          "در حال افزودن…"
        ) : status === "added" ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            به سبد اضافه شد
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            افزودن به سبد خرید
          </>
        )}
      </button>
    </div>
  );
}
