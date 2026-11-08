"use client";

import { useState } from "react";
import { X, Loader2, FolderTree, Image as ImageIcon } from "lucide-react";
import type { Category, CreateCategoryInput } from "@/lib/api";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (data: CreateCategoryInput, id?: string) => Promise<void>;
}

export function CategoryModal(props: CategoryModalProps) {
  if (!props.isOpen) return null;
  return <CategoryFormDialog {...props} key={props.category?.id ?? "new-category"} />;
}

function CategoryFormDialog({
  onClose,
  category,
  onSave,
}: CategoryModalProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [sortOrder, setSortOrder] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("لطفاً نام دسته‌بندی را وارد کنید.");
    if (!slug.trim()) return setError("لطفاً نام انگلیسی دسته‌بندی (slug) را وارد کنید.");

    setLoading(true);
    setError(null);

    try {
      const payload: CreateCategoryInput = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
      };

      await onSave(payload, category?.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطایی در ذخیره دسته‌بندی رخ داد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 id="category-modal-title" className="text-base font-bold text-[var(--color-wood)]">
              {category ? `ویرایش دسته‌بندی: ${category.name}` : "افزودن دسته‌بندی جدید"}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
              نام فارسی دسته‌بندی *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!category && !slug) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .trim()
                      .replace(/[^\w\s-]/g, "")
                      .replace(/[\s_-]+/g, "-"),
                  );
                }
              }}
              placeholder="مثلاً: تخته‌های سرو و آشپزخانه"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
            />
          </div>

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
              placeholder="serving-boards"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-mono font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
              توضیح کوتاه
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح مختصر درباره دست‌سازه‌های این شاخه…"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
              آدرس تصویر شاخص
            </label>
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
              <input
                type="text"
                dir="ltr"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/categories/serving.jpg"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white pr-9 pl-4 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
              اولویت چینش (عدد کمتر = نمایش بالاتر)
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
            />
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
              {category ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
