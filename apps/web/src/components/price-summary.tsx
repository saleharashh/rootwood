import React from "react";
import { cn } from "@/lib/utils";
import { formatPriceToman } from "@/lib/price";

interface PriceSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
  compact?: boolean;
  className?: string;
}

export function PriceSummary({ subtotal, shipping, total, compact, className }: PriceSummaryProps) {
  return (
    <div className={cn("space-y-2.5 text-sm", className)}>
      <div className="flex items-center justify-between text-[var(--color-ink-soft)]">
        <span>مجموع کالاها</span>
        <span className="font-medium text-[var(--color-ink)]">{formatPriceToman(subtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-[var(--color-ink-soft)]">
        <span>بسته‌بندی و ارسال</span>
        {shipping === 0 ? (
          <span className="font-bold text-[var(--color-success)]">رایگان</span>
        ) : (
          <span className="font-medium text-[var(--color-ink)]">{formatPriceToman(shipping)}</span>
        )}
      </div>

      <div
        className={cn(
          "flex items-baseline justify-between border-t border-[var(--color-border-subtle)] pt-3",
          compact ? "text-sm" : "text-base"
        )}
      >
        <span className="font-bold text-[var(--color-ink)]">مبلغ نهایی</span>
        <span className="font-serif text-xl font-black text-[var(--color-accent)]">
          {formatPriceToman(total)}
        </span>
      </div>
    </div>
  );
}
