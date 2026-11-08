"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast-provider";
import { formatCount, formatPriceShort } from "@/lib/price";
import type { Product } from "@/lib/api";
import { useState } from "react";
import { Check, ShoppingBag, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem, refreshing } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  const image = product.images[0];
  const isAvailable = product.stock > 0;

  async function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (refreshing) return;
    try {
      await addItem(product.id, 1);
      setAdded(true);
      toast(`«${product.name}» به سبد خرید اضافه شد`, "success");
      setTimeout(() => setAdded(false), 1400);
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "افزودن به سبد خرید ممکن نشد", "error");
    }
  }

  return (
    <article className="group glass-card card-lift relative flex flex-col overflow-hidden rounded-2xl bg-white p-2.5 transition-all">
      <Link
        href={`/products/${product.slug}`}
        className="glass-media relative block aspect-[4/3] overflow-hidden rounded-xl bg-[#f4efea]"
        aria-label={`مشاهده ${product.name}`}
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-ink-mute)]">
            <svg
              className="h-10 w-10 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {product.featured && (
          <span className="absolute top-2.5 start-2.5 rounded-md bg-[var(--color-wood)] px-2.5 py-0.5 text-[11px] font-semibold text-[#faf7f2] shadow-xs">
            ویژه
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="text-base font-semibold leading-snug text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent)]"
          >
            {product.name}
          </Link>
          {product.woodType && (
            <span className="shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-soft)]">
              {product.woodType}
            </span>
          )}
        </div>

        {product.tagline && (
          <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
            {product.tagline}
          </p>
        )}

        {product.rating.count > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
            <div
              role="img"
              className="flex items-center gap-0.5"
              aria-label={`${product.rating.average} از ۵ ستاره`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(product.rating.average)
                      ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                      : "fill-transparent text-[var(--color-border-strong)]"
                  }`}
                />
              ))}
            </div>
            <span>({formatCount(product.rating.count)})</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-base font-bold text-[var(--color-wood)]">
              {formatPriceShort(product.price)}
            </span>
            {product.compareAt && product.compareAt > product.price && (
              <span className="whitespace-nowrap text-xs text-[var(--color-ink-mute)] line-through">
                {formatPriceShort(product.compareAt)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable || refreshing}
            aria-label={isAvailable ? `افزودن ${product.name} به سبد خرید` : "ناموجود"}
            className={`btn shrink-0 whitespace-nowrap px-3.5 py-2 text-xs font-semibold ${
              isAvailable
                ? added
                  ? "bg-[var(--color-success)] text-white border-transparent"
                  : "btn-primary"
                : "cursor-not-allowed bg-[var(--color-surface-2)] text-[var(--color-ink-soft)] font-medium border border-[var(--color-border)]"
            }`}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                اضافه شد
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                {isAvailable ? "خرید" : "ناموجود"}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
