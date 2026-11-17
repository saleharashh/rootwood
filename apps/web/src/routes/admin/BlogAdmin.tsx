import React, { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  Check,
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { api, type BlogPost } from "@/lib/api";
import { formatJalaliDate, toPersianDigits } from "@/lib/price";
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
  inputClass,
} from "./components";

function PostFormModal({
  post,
  open,
  onClose,
  onSaved,
}: {
  post: BlogPost | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setSlug(post.slug || "");
      setExcerpt(post.excerpt || "");
      setContent(post.content || "");
      setCoverImage(post.coverImage || "");
      setTagsInput(Array.isArray(post.tags) ? post.tags.join("، ") : "");
      setPublished(post.published !== false);
    } else {
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setCoverImage("/images/workshop.webp");
      setTagsInput("");
      setPublished(true);
    }
  }, [post, open]);

  // Auto-generate slug from title if empty
  const handleTitleBlur = () => {
    if (!slug && title) {
      const generated = title
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("عنوان مقاله الزامی است", "error");
      return;
    }

    const tags = tagsInput
      .split(/[,،]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImage: coverImage.trim() || "/images/workshop.webp",
      tags,
      published,
    };

    setSaving(true);
    try {
      if (post) {
        await api.updateAdminPost(post.id, payload);
        showToast("مقاله با موفقیت به‌روزرسانی شد", "success");
      } else {
        await api.createAdminPost(payload);
        showToast("مقاله جدید با موفقیت منتشر شد", "success");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ذخیره مقاله", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={post ? "ویرایش مقاله مجله" : "افزودن مقاله جدید به مجله"}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            انصراف
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? "در حال ذخیره…" : post ? "ذخیره تغییرات" : "انتشار مقاله"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="عنوان مقاله">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="مثال: راهنمای انتخاب گونه‌های چوب برای میز ناهارخوری"
            className={inputClass}
            required
          />
        </Field>

        <Field label="نامک (Slug / نشانی اینترنتی یکتا)" hint="در صورت خالی گذاشتن، به‌صورت خودکار از عنوان تولید می‌شود.">
          <input
            type="text"
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="guide-to-wood-species"
            className={inputClass}
          />
        </Field>

        <Field label="خلاصه کوتاه مقاله" hint="متن کوتاهی که در کارت‌های صفحه اصلی و مجله نمایش داده می‌شود.">
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="معرفی ویژگی‌ها و تفاوت‌های چوب گردو، بلوط و گیلاس در ساخت مبلمان…"
            className={inputClass}
          />
        </Field>

        {/* Image Upload Field with 1MB Limit */}
        <ImageUploadField
          label="تصویر شاخص مقاله"
          value={coverImage}
          onChange={(url) => setCoverImage(url)}
          hint="فایل‌های مجاز: JPG, PNG, WEBP (حداکثر ۱ مگابایت)"
        />

        <Field label="متن کامل مقاله">
          <textarea
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="متن کامل مقاله، توضیحات و سرفصل‌ها…"
            className={inputClass}
          />
        </Field>

        <Field label="برچسب‌ها (با ویرگول یا کاما جدا کنید)">
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="بلوط، نجاری سنتی، روغن گیاهی، دکوراسیون"
            className={inputClass}
          />
        </Field>

        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--color-ink)]">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded accent-[var(--color-accent)]"
            />
            <span>وضعیت: انتشار عمومی در وب‌سایت</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BlogPost | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPosts({
        q: search || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setPosts(data || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری مقالات", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleTogglePublish = async (post: BlogPost) => {
    const nextStatus = !post.published;
    setBusyId(post.id);
    try {
      await api.togglePostPublish(post.id, nextStatus);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: nextStatus } : p))
      );
      showToast(nextStatus ? "مقاله منتشر شد" : "مقاله به پیش‌نویس تبدیل شد", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در تغییر وضعیت انتشار", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    try {
      await api.deleteAdminPost(confirmDelete.id);
      setPosts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      showToast("مقاله با موفقیت حذف شد", "success");
      setConfirmDelete(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در حذف مقاله", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminSectionHeader
          title="مدیریت مجله و مقالات"
          description="ایجاد، ویرایش، بارگذاری تصاویر و انتشار مقالات تخصصی و آموزشی آتلیه روت‌وود"
        >
          <Button
            size="sm"
            onClick={() => {
              setSelectedPost(null);
              setModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            افزودن مقاله جدید
          </Button>
        </AdminSectionHeader>

        {/* Filters & Search */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-ink-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان یا متن مقالات…"
              className="w-full rounded-xl border border-[var(--color-border)] bg-white pr-9 pl-3 py-2 text-xs outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: "ALL", label: "همه" },
                { id: "PUBLISHED", label: "منتشرشده" },
                { id: "DRAFT", label: "پیش‌نویس" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === f.id
                    ? "bg-[var(--color-accent)] text-white shadow-2xs"
                    : "border border-[var(--color-border)] bg-white text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        {loading ? (
          <LoadingBlock label="در حال دریافت مقالات مجله…" />
        ) : posts.length === 0 ? (
          <div className="my-10 flex flex-col items-center justify-center gap-2 text-center text-xs text-[var(--color-ink-muted)]">
            <BookOpen className="h-10 w-10 stroke-1 text-[var(--color-ink-muted)]" />
            <p>هیچ مقاله‌ای با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
            {posts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-4 p-4 transition hover:bg-[var(--color-surface-2)]/40 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Article Info & Thumbnail */}
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    <img
                      src={p.coverImage || "/images/workshop.webp"}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/images/workshop.webp";
                      }}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          p.published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        {p.published ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                        /blog/{p.slug}
                      </span>
                    </div>

                    <h3 className="truncate font-serif text-sm font-bold text-[var(--color-ink)]">
                      {p.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-ink-muted)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatJalaliDate(p.createdAt)}
                      </span>
                      {p.author?.name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {p.author.name}
                        </span>
                      )}
                      {p.tags && p.tags.length > 0 && (
                        <span className="hidden items-center gap-1 sm:inline-flex">
                          <Tag className="h-3 w-3" />
                          {p.tags.slice(0, 3).join("، ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <a
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    title="مشاهده در سایت"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>

                  <Button
                    size="sm"
                    variant={p.published ? "outline" : "default"}
                    onClick={() => handleTogglePublish(p)}
                    disabled={busyId === p.id}
                    className="h-8 px-2.5 text-xs"
                  >
                    {p.published ? "عدم انتشار" : "انتشار"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPost(p);
                      setModalOpen(true);
                    }}
                    className="h-8 gap-1 px-2.5 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    ویرایش
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDelete(p)}
                    disabled={busyId === p.id}
                    className="h-8 w-8 p-0"
                    title="حذف مقاله"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Add / Edit Modal */}
      <PostFormModal
        post={selectedPost}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPost(null);
        }}
        onSaved={loadPosts}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="حذف مقاله"
        description={`آیا از حذف دائمی مقاله «${confirmDelete?.title}» اطمینان دارید؟ این عمل غیرقابل بازگشت است.`}
        confirmLabel="حذف دائمی"
        busy={busyId === confirmDelete?.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
