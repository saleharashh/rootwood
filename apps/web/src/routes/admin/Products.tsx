import React, { useCallback, useEffect, useState } from "react";
import { Archive, Edit, Image as ImageIcon, Minus, Plus, Search, Star, Trash2, Undo2 } from "lucide-react";
import { api, type Category, type Product } from "@/lib/api";
import { formatPriceToman, toPersianDigits } from "@/lib/price";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import {
  AdminCard,
  AdminSectionHeader,
  ConfirmDialog,
  Field,
  ImageUploadField,
  LoadingBlock,
  Modal,
  Pagination,
  inputClass,
} from "./components";

const PAGE_SIZE = 20;

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    categoryId: product?.categoryId || product?.category?.id || categories[0]?.id || "",
    price: product ? String(product.price) : "",
    compareAt: product?.compareAt ? String(product.compareAt) : "",
    stock: product ? String(product.stock) : "5",
    woodType: product?.woodType || "",
    finish: product?.finish || "",
    dimensions: product?.dimensions || "",
    weightKg: product?.weightKg ? String(product.weightKg) : "",
    tagline: product?.tagline || "",
    description: product?.description || "",
    imageUrl: product?.images?.[0]?.url || product?.imageUrl || "/images/workshop.webp",
    featured: !!product?.featured,
    isActive: product?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const price = parseInt(form.price, 10) || 0;
    if (!form.name.trim() || price <= 0 || !form.categoryId) {
      showToast("نام، دسته‌بندی و قیمت اثر الزامی است", "error");
      return;
    }

    const payload = {
      name: form.name.trim(),
      title: form.name.trim(),
      slug: form.slug.trim() || undefined,
      categoryId: form.categoryId,
      price,
      compareAt: form.compareAt ? parseInt(form.compareAt, 10) : null,
      stock: parseInt(form.stock, 10) || 0,
      woodType: form.woodType.trim() || null,
      finish: form.finish.trim() || null,
      dimensions: form.dimensions.trim() || null,
      weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
      tagline: form.tagline.trim() || null,
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim() || "/images/workshop.webp",
      images: [form.imageUrl.trim() || "/images/workshop.webp"],
      featured: form.featured,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (product) {
        await api.updateProduct(product.id, payload);
        showToast("مشخصات اثر ذخیره شد", "success");
      } else {
        await api.createProduct({
          ...payload,
          sku: `RW-${Math.floor(1000 + Math.random() * 9000)}`,
        });
        showToast("اثر جدید به کاتالوگ اضافه شد", "success");
      }
      onSaved();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ذخیرهٔ اثر", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="نام اثر *">
          <input value={form.name} onChange={(event) => set("name", event.target.value)} className={inputClass} />
        </Field>
        <Field label="نامک (اختیاری)" hint="اگر خالی بماند خودکار ساخته می‌شود">
          <input value={form.slug} onChange={(event) => set("slug", event.target.value)} className={inputClass} dir="ltr" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="دسته‌بندی *">
          <select
            value={form.categoryId}
            onChange={(event) => set("categoryId", event.target.value)}
            className={inputClass}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="قیمت (تومان) *">
          <input
            type="number"
            value={form.price}
            onChange={(event) => set("price", event.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="قیمت پیش از تخفیف">
          <input
            type="number"
            value={form.compareAt}
            onChange={(event) => set("compareAt", event.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="موجودی انبار">
          <input
            type="number"
            value={form.stock}
            onChange={(event) => set("stock", event.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
        <Field label="گونهٔ چوب">
          <input value={form.woodType} onChange={(event) => set("woodType", event.target.value)} className={inputClass} />
        </Field>
        <Field label="ابعاد">
          <input
            value={form.dimensions}
            onChange={(event) => set("dimensions", event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="فینیش">
          <input value={form.finish} onChange={(event) => set("finish", event.target.value)} className={inputClass} />
        </Field>
        <Field label="وزن (کیلوگرم)">
          <input
            type="number"
            value={form.weightKg}
            onChange={(event) => set("weightKg", event.target.value)}
            className={inputClass}
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="یک خط معرفی">
        <input value={form.tagline} onChange={(event) => set("tagline", event.target.value)} className={inputClass} />
      </Field>

      <Field label="توضیحات">
        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
          className={inputClass}
        />
      </Field>

      <ImageUploadField
        label="تصویر اثر"
        value={form.imageUrl}
        onChange={(url) => set("imageUrl", url)}
      />

      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-canvas)] p-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--color-ink-soft)]">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => set("featured", event.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          نمایش در ویترین پرفروش‌ها
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--color-ink-soft)]">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => set("isActive", event.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          فعال در فروشگاه
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border-subtle)] pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
          انصراف
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "در حال ذخیره…" : product ? "ذخیرهٔ تغییرات" : "افزودن اثر"}
        </Button>
      </div>
    </form>
  );
}

export function ProductsAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.getAdminProducts({
        search: search || undefined,
        status,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setItems(response.items || []);
      setTotal(response.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در دریافت محصولات");
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    api
      .getCategories()
      .then((response) => setCategories(response.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const patchProduct = async (product: Product, data: Record<string, unknown>, message: string) => {
    setBusyId(product.id);
    try {
      await api.updateProduct(product.id, data);
      showToast(message, "success");
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در به‌روزرسانی اثر", "error");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const response = await api.deleteProduct(deleting.id);
      showToast(response.message || "اثر حذف یا بایگانی شد", "success");
      setDeleting(null);
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در حذف اثر", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminCard>
      <AdminSectionHeader
        title="کاتالوگ و انبار"
        description={`${toPersianDigits(total)} اثر ثبت شده است؛ آرشیوشده‌ها هم قابل مشاهده‌اند`}
      >
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="نام یا کد اثر"
            className={`${inputClass} w-48 pr-8`}
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
          className={`${inputClass} w-36`}
        >
          <option value="all">همه</option>
          <option value="active">فعال</option>
          <option value="archived">بایگانی</option>
        </select>

        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          اثر جدید
        </Button>
      </AdminSectionHeader>

      {error && <p className="py-8 text-center text-xs text-red-700">{error}</p>}

      {loading && items.length === 0 ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-xs text-[var(--color-ink-muted)]">
          اثری با این فیلترها پیدا نشد.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-ink-muted)]">
                <th className="p-2.5 font-semibold">اثر</th>
                <th className="p-2.5 font-semibold">دسته</th>
                <th className="p-2.5 font-semibold">قیمت</th>
                <th className="p-2.5 font-semibold">موجودی</th>
                <th className="p-2.5 font-semibold">وضعیت</th>
                <th className="p-2.5 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {items.map((product) => {
                const busy = busyId === product.id;
                return (
                  <tr key={product.id} className="hover:bg-[var(--color-canvas)]">
                    <td className="p-2.5">
                      <div className="flex items-center gap-2.5">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="h-10 w-10 shrink-0 rounded-lg border border-[var(--color-border)] object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]">
                            <ImageIcon className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-bold text-[var(--color-ink)]">
                            {product.title}
                          </div>
                          <div className="font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                            {product.sku || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 text-[var(--color-ink-soft)]">
                      {product.category?.name || "—"}
                    </td>
                    <td className="p-2.5 font-bold text-[var(--color-ink)]">
                      {formatPriceToman(product.price)}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={busy || product.stock <= 0}
                          onClick={() =>
                            patchProduct(product, { stock: product.stock - 1 }, "موجودی کاهش یافت")
                          }
                          className="rounded-md border border-[var(--color-border)] p-1 disabled:opacity-40"
                          aria-label="کاهش موجودی"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className={`min-w-7 text-center font-mono font-bold ${
                            product.stock <= 3 ? "text-red-700" : "text-[var(--color-ink)]"
                          }`}
                        >
                          {toPersianDigits(product.stock)}
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            patchProduct(product, { stock: product.stock + 1 }, "موجودی افزایش یافت")
                          }
                          className="rounded-md border border-[var(--color-border)] p-1 disabled:opacity-40"
                          aria-label="افزایش موجودی"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            product.isActive === false
                              ? "border-stone-200 bg-stone-100 text-stone-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {product.isActive === false ? "بایگانی" : "فعال"}
                        </span>
                        {product.featured && (
                          <span className="w-fit rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                            پرفروش
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => setEditing(product)}
                          className="h-7 px-2 text-[11px]"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            patchProduct(
                              product,
                              { featured: !product.featured },
                              product.featured ? "از ویترین برداشته شد" : "به ویترین اضافه شد"
                            )
                          }
                          className={`h-7 px-2 ${product.featured ? "text-[var(--color-accent)]" : ""}`}
                          aria-label="تغییر پرفروش"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            patchProduct(
                              product,
                              { isActive: product.isActive === false },
                              product.isActive === false ? "اثر به فروشگاه بازگشت" : "اثر بایگانی شد"
                            )
                          }
                          className="h-7 px-2 text-[11px]"
                          aria-label="بایگانی یا بازگردانی"
                        >
                          {product.isActive === false ? (
                            <Undo2 className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => setDeleting(product)}
                          className="h-7 px-2 text-red-700"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />

      <Modal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? "ویرایش اثر" : "افزودن اثر جدید"}
        size="lg"
      >
        <ProductForm
          key={editing?.id || "new"}
          product={editing}
          categories={categories}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="حذف اثر"
        description="اگر این اثر در سفارش‌های گذشته استفاده شده باشد، به‌جای حذف بایگانی می‌شود تا سابقهٔ سفارش‌ها سالم بماند."
        confirmLabel="حذف"
        busy={!!busyId}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </AdminCard>
  );
}
