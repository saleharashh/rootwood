import React, { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star, Check } from "lucide-react";
import { Product } from "@/lib/api";
import { formatPrice } from "@/lib/price";
import { useCart } from "./cart-provider";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const imageUrl = product.images?.[0]?.url || product.imageUrl || "/images/workshop.webp";

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0 || adding) return;

    setAdding(true);
    try {
      await addItem(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="group relative flex flex-col rounded-3xl border border-[var(--color-border)] bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-card transition-all duration-300">
      {/* Image container */}
      <Link href={`/products/${product.slug}`} className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-[var(--color-surface-2)]">
        <img
          src={imageUrl}
          alt={product.images?.[0]?.alt || product.name || product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {product.featured && (
            <span className="badge bg-[var(--color-wood)] text-white text-[10px] font-bold shadow-xs">
              پرفروش
            </span>
          )}
          {product.compareAt && product.compareAt > product.price && (
            <span className="badge bg-red-600 text-white text-[10px] font-bold shadow-xs">
              تخفیف ویژه
            </span>
          )}
        </div>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
            <span className="badge bg-stone-800 text-white font-bold text-xs px-3 py-1.5">
              ناموجود
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between pt-4">
        <div>
          {/* Category & Wood tags */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-ink-mute)] mb-1.5">
            <span>{product.category?.name || "مبلمان"}</span>
            {product.woodType && (
              <span className="text-[var(--color-accent-strong)]">{product.woodType}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-[var(--color-wood)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Tagline */}
          {product.tagline && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-1 line-clamp-1">
              {product.tagline}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-[var(--color-ink)]">
              {(typeof product.rating === "number" ? product.rating : (product.ratingObj?.average ?? 5)).toLocaleString("fa-IR")}
            </span>
            {product.reviewsCount > 0 && (
              <span className="text-[11px] text-[var(--color-ink-mute)]">
                ({product.reviewsCount.toLocaleString("fa-IR")})
              </span>
            )}
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--color-border)]/60">
          <div>
            <div className="text-sm sm:text-base font-black text-[var(--color-wood)]">
              {formatPrice(product.price)}
            </div>
            {product.compareAt && product.compareAt > product.price && (
              <div className="text-[11px] text-[var(--color-ink-mute)] line-through">
                {formatPrice(product.compareAt)}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || adding}
            className={`btn py-2 px-3 text-xs font-bold gap-1.5 rounded-xl transition-all ${
              added
                ? "bg-[var(--color-success)] text-white"
                : "btn-primary"
            }`}
            aria-label={`افزودن ${product.name} به سبد خرید`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>اضافه شد</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>به سبد خرید</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
