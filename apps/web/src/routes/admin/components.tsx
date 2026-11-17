import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}

export function AdminSectionHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-serif text-lg font-bold text-[var(--color-ink)]">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function pageWindow(current: number, total: number) {
  const size = Math.min(5, total);
  let start = Math.max(1, current - Math.floor(size / 2));
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <span className="text-[11px] text-[var(--color-ink-muted)]">
        صفحهٔ {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="iconSm"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="صفحهٔ قبل"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {pageWindow(page, totalPages).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onChange(pageNumber)}
            className={cn(
              "h-8 w-8 rounded-lg text-xs font-bold transition-colors",
              pageNumber === page
                ? "bg-[var(--color-accent)] text-white"
                : "border border-[var(--color-border)] bg-white text-[var(--color-ink-soft)] hover:bg-[var(--color-accent-soft)]"
            )}
          >
            {pageNumber.toLocaleString("fa-IR")}
          </button>
        ))}

        <Button
          variant="outline"
          size="iconSm"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="صفحهٔ بعد"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative my-6 w-full rounded-2xl border border-[var(--color-border)] bg-white shadow-xl",
          size === "lg" ? "max-w-3xl" : "max-w-xl"
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] p-5">
          <div>
            <h2 className="font-serif text-base font-bold text-[var(--color-ink)]">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border-subtle)] p-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "تأیید",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            انصراف
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={busy}>
            {busy ? "در حال انجام…" : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{description}</p>
    </Modal>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-semibold text-[var(--color-ink-soft)]">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-[var(--color-ink-muted)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20";

export function LoadingBlock({ label = "در حال بارگذاری…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-xs text-[var(--color-ink-muted)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)]" />
      {label}
    </div>
  );
}

const MAX_IMAGE_BYTES = 1024 * 1024; // 1 Megabyte

export function ImageUploadField({
  label = "تصویر شاخص",
  value,
  onChange,
  hint = "فرمت‌های مجاز: JPG, PNG, WEBP, GIF (حداکثر ۱ مگابایت)",
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 1MB check
    if (file.size > MAX_IMAGE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showToast(
        `حجم فایل انتخابی (${sizeMB} مگابایت) بیشتر از سقف مجاز ۱ مگابایت است. لطفاً فایل کم‌حجم‌تری انتخاب کنید.`,
        "error"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res?.url) {
        onChange(res.url);
        showToast("تصویر با موفقیت بارگذاری شد", "success");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در آپلود تصویر", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--color-ink-soft)]">{label}</label>
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] text-[var(--color-accent)] hover:underline"
        >
          {showManualUrl ? "بستن آدرس دستی" : "ورود دستی آدرس تصویر"}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Thumbnail Preview */}
        {value ? (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
            <img
              src={value}
              alt="پیش‌نمایش تصویر"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/images/workshop.webp";
              }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-red-600"
              title="حذف تصویر"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/60 text-[var(--color-ink-muted)]">
            <ImageIcon className="h-6 w-6 stroke-1 text-[var(--color-ink-muted)]" />
            <span className="mt-1 text-[10px]">بدون تصویر</span>
          </div>
        )}

        {/* Upload Button & Info */}
        <div className="flex flex-1 flex-col gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 text-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  در حال بارگذاری…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  انتخاب و آپلود تصویر (حداکثر ۱MB)
                </>
              )}
            </Button>
            {value && (
              <span className="truncate font-mono text-[11px] text-[var(--color-ink-muted)]">
                {value.split("/").pop()}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--color-ink-muted)]">{hint}</p>
        </div>
      </div>

      {showManualUrl && (
        <div className="pt-1">
          <input
            type="text"
            dir="ltr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.webp یا /images/sample.webp"
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}
