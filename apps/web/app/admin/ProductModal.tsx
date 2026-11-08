"use client";

import { useState } from "react";
import { X, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import type { Category, CreateProductInput, Product } from "@/lib/api";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onSave: (data: CreateProductInput, id?: string) => Promise<void>;
}

export function ProductModal(props: ProductModalProps) {
  if (!props.isOpen) return null;
  return <ProductFormDialog {...props} key={props.product?.id ?? "new-product"} />;
}

function ProductFormDialog({
  onClose,
  product,
  categories,
  onSave,
}: ProductModalProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [compareAt, setCompareAt] = useState<number | undefined>(
    product?.compareAt ?? undefined,
  );
  const [sku, setSku] = useState(product?.sku ?? "");
  const [stock, setStock] = useState(product?.stock ?? 1);
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? (categories[0]?.id ?? ""),
  );
  const [woodType, setWoodType] = useState(product?.woodType ?? "بلوط ایرانی");
  const [finish, setFinish] = useState(product?.finish ?? "روغن‌موم مات گیاهی");
  const [dimensions, setDimensions] = useState(product?.dimensions ?? "");
  const [weightKg, setWeightKg] = useState<number | undefined>(
    product?.weightKg ?? undefined,
  );
  const [imageUrl, setImageUrl] = useState(product?.images?.[0]?.url ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("لطفاً نام محصول را وارد کنید.");
    if (!slug.trim()) return setError("لطفاً نام انگلیسی محصول (slug) را وارد کنید.");
    if (!categoryId) return setError("لطفاً دسته‌بندی محصول را انتخاب کنید.");
    if (!description.trim()) return setError("لطفاً توضیحات محصول را وارد کنید.");
    if (price < 0) return setError("قیمت نمی‌تواند منفی باشد.");
    if (stock < 0) return setError("موجودی نمی‌تواند منفی باشد.");

    setLoading(true);
    setError(null);

    try {
      const payload: CreateProductInput = {
        name: name.trim(),
        slug: slug.trim(),
        tagline: tagline.trim() || undefined,
        description: description.trim(),
        price: Number(price),
        compareAt: compareAt ? Number(compareAt) : undefined,
        sku: sku.trim(),
        stock: Number(stock),
        categoryId,
        woodType: woodType.trim() || undefined,
        finish: finish.trim() || undefined,
        dimensions: dimensions.trim() || undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        featured,
        isActive,
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      };

      await onSave(payload, product?.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطایی در ذخیره محصول رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="flex w-full max-w-3xl flex-col max-h-[92vh] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 id="product-modal-title" className="text-base font-bold text-[var(--color-wood)]">
              {product ? `ویرایش محصول: ${product.name}` : "افزودن محصول جدید به کارگاه"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-mute)] hover:bg-neutral-200 hover:text-[var(--color-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                عنوان محصول *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!product && !slug) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, "")
                        .replace(/[\s_-]+/g, "-"),
                    );
                  }
                }}
                placeholder="مثلاً: میز ناهارخوری بلوط کهنسال"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                نام انگلیسی در آدرس (Slug) *
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="oak-dining-table"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-mono font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                دسته‌بندی کارگاه *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              >
                <option value="" disabled>انتخاب کنید…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                شناسه فنی کارگاه (SKU) *
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="RW-OAK-01"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-mono font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                قیمت فروش (تومان) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* CompareAt */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                قیمت قبل تخفیف (اختیاری)
              </label>
              <input
                type="number"
                min={0}
                value={compareAt ?? ""}
                onChange={(e) =>
                  setCompareAt(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="تومان"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                موجودی انبار کارگاه *
              </label>
              <input
                type="number"
                required
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Wood Type */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                گونه چوب
              </label>
              <input
                type="text"
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
                placeholder="بلوط کهنسال، گردوی آمریکایی، توت…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Finish */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                پرداخت سطح
              </label>
              <input
                type="text"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                placeholder="روغن‌موم مات ارگانیک، پلی‌اورتان ضدخش…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                ابعاد دقیق
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="مثلاً: ۲۰۰ × ۹۰ × ۷۸ سانتی‌متر"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                وزن تقریبی (کیلوگرم)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={weightKg ?? ""}
                onChange={(e) =>
                  setWeightKg(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="مثلاً: ۳۵"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Image URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                آدرس تصویر محصول
              </label>
              <div className="relative">
                <ImageIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
                <input
                  type="text"
                  dir="ltr"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/products/oak-dining.jpg یا https://..."
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white pr-9 pl-4 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
                />
              </div>
            </div>

            {/* Tagline */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                شعار / معرفی کوتاه (اختیاری)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="یک جمله جذاب درباره اصالت و ساختار این قطعه"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                توضیحات و مشخصات ساختاری محصول *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیح کامل در مورد گونه چوب، ساختار اتصالات، نوع پرداخت روغنی و حس لمس قطعه…"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3.5 text-xs font-medium leading-relaxed text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6 border-t border-[var(--color-border)] pt-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--color-accent)]"
              />
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                محصول ویژه صفحه نخست
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--color-accent)]"
              />
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                فعال و قابل مشاهده در فروشگاه
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost px-4 py-2 text-xs font-semibold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-5 py-2 text-xs font-semibold gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? "ذخیره تغییرات محصول" : "افزودن محصول به کارگاه"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
