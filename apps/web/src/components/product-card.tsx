import React, { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Star, Check, Flame, ArrowLeft } from "lucide-react";
import { type Product } from "@/lib/api";
import { formatPriceToman, toPersianDigits } from "@/lib/price";
import { useCart } from "./cart-provider";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, getItemQuantity } = useCart();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const imageUrl = product.images?.[0]?.url || product.imageUrl || "/images/workshop.webp";
  const inCartQty = getItemQuantity(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0 || adding) return;

    setAdding(true);
    try {
      await addItem(product.id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  const discountPercent =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : null;

  const ratingVal =
    typeof product.rating === "number" ? product.rating : product.ratingObj?.average ?? 5;

  return (
    <article className="group relative flex flex-col rounded-3xl border border-stone-200/90 bg-white p-3.5 sm:p-4 shadow-card hover:shadow-xl hover:border-amber-900/30 transition-all duration-300">
      {/* Image container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-stone-100 block"
      >
        <img
          src={imageUrl}
          alt={product.images?.[0]?.alt || product.name || product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Floating Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10">
          {product.featured && (
            <Badge variant="gold" className="shadow-xs backdrop-blur-xs gap-1">
              <Flame className="w-3 h-3 text-amber-700 fill-current" />
              <span>پرفروش کارگاه</span>
            </Badge>
          )}
          {discountPercent && (
            <Badge variant="destructive" className="shadow-xs font-bold">
              {toPersianDigits(discountPercent)}٪ تخفیف
            </Badge>
          )}
        </div>

        {/* Wood Species Floating Tag */}
        {product.woodType && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="text-[11px] font-semibold bg-stone-900/80 backdrop-blur-xs text-amber-100 px-2.5 py-1 rounded-xl shadow-xs border border-white/10">
              {product.woodType}
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="text-white font-bold text-xs px-4 py-2 rounded-xl bg-stone-900 border border-stone-700">
              سفارشی‌ساخت (عدم موجودی آماده)
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between pt-4 space-y-3">
        <div className="space-y-1.5">
          {/* Category Tag */}
          <div className="text-[11px] font-semibold text-stone-500">
            {product.category?.name || "دست‌سازه‌های چوبی"}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold font-serif text-stone-900 group-hover:text-[#8c4f27] transition-colors line-clamp-1 leading-snug">
            <Link href={`/products/${product.slug}`}>{product.name || product.title}</Link>
          </h3>

          {/* Tagline / Excerpt */}
          <p className="text-xs text-stone-500 line-clamp-1 leading-relaxed">
            {product.tagline || product.shortDescription || product.description?.slice(0, 80)}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 pt-1 text-xs text-stone-600">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="font-bold text-stone-900">
              {toPersianDigits(ratingVal.toFixed(1))}
            </span>
            {product.reviewsCount > 0 && (
              <span className="text-[11px] text-stone-400">
                ({toPersianDigits(product.reviewsCount)} نظر)
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <div>
            {product.compareAt && product.compareAt > product.price && (
              <div className="text-[11px] text-stone-400 line-through">
                {formatPriceToman(product.compareAt)}
              </div>
            )}
            <div className="text-sm sm:text-base font-extrabold text-[#8c4f27] font-serif">
              {formatPriceToman(product.price)}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            type="button"
            size="sm"
            variant={justAdded ? "wood" : "outline"}
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || adding}
            className={`gap-1.5 rounded-xl text-xs transition-all ${
              justAdded
                ? "bg-emerald-800 text-white border-emerald-800"
                : "hover:bg-[#8c4f27] hover:text-white hover:border-[#8c4f27]"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>ثبت شد</span>
              </>
            ) : inCartQty > 0 ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>({toPersianDigits(inCartQty)})</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">افزودن</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
