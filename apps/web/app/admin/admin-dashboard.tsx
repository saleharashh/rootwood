"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Boxes,
  Check,
  CircleAlert,
  Edit3,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Loader2,
  Mail,
  MessageSquare,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  ApiError,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getAdminOrders,
  getAdminReviews,
  getAdminSummary,
  getCategories,
  getContactTickets,
  getProducts,
  setReviewApproval,
  updateCategory,
  updateContactStatus,
  updateOrderStatus,
  updateProduct,
  type AdminOrderList,
  type AdminReviewList,
  type AdminSummary,
  type Category,
  type ContactListResponse,
  type ContactTicket,
  type CreateCategoryInput,
  type CreateProductInput,
  type OrderStatus,
  type Product,
  type ProductListResponse,
} from "@/lib/api";
import { formatCount, formatDate, formatPrice } from "@/lib/price";
import { useAuth } from "@/components/auth-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import { useToast } from "@/components/toast-provider";
import { ProductModal } from "./ProductModal";
import { CategoryModal } from "./CategoryModal";

type Tab = "overview" | "orders" | "products" | "categories" | "reviews" | "tickets";

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "نمای کلی", icon: BarChart3 },
  { id: "orders", label: "سفارش‌ها", icon: Package },
  { id: "products", label: "محصولات", icon: Boxes },
  { id: "categories", label: "دسته‌بندی‌ها", icon: FolderTree },
  { id: "reviews", label: "نظرات", icon: Star },
  { id: "tickets", label: "پیام‌ها", icon: MessageSquare },
];

const ORDER_STATUS: Record<OrderStatus, { label: string; chip: string }> = {
  PENDING: {
    label: "در انتظار پرداخت",
    chip: "border border-amber-300 bg-amber-50 text-amber-950 font-bold",
  },
  PAID: {
    label: "پرداخت‌شده",
    chip: "border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold",
  },
  SHIPPED: {
    label: "ارسال‌شده",
    chip: "border border-sky-300 bg-sky-50 text-sky-950 font-bold",
  },
  DELIVERED: {
    label: "تحویل‌شده",
    chip: "border border-teal-300 bg-teal-50 text-teal-950 font-bold",
  },
  CANCELLED: {
    label: "لغوشده",
    chip: "border border-rose-300 bg-rose-50 text-rose-950 font-bold",
  },
};

const ORDER_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "همه" },
  { value: "PENDING", label: "در انتظار" },
  { value: "PAID", label: "پرداخت‌شده" },
  { value: "SHIPPED", label: "ارسال‌شده" },
  { value: "DELIVERED", label: "تحویل‌شده" },
  { value: "CANCELLED", label: "لغوشده" },
];

const TICKET_STATUS: Record<string, { label: string; chip: string }> = {
  NEW: {
    label: "جدید",
    chip: "border border-amber-300 bg-amber-50 text-amber-950 font-bold",
  },
  IN_PROGRESS: {
    label: "در حال بررسی",
    chip: "border border-sky-300 bg-sky-50 text-sky-950 font-bold",
  },
  RESOLVED: {
    label: "حل‌شده",
    chip: "border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold",
  },
};

const TICKET_FILTERS = [
  { value: "", label: "همه" },
  { value: "NEW", label: "جدید" },
  { value: "IN_PROGRESS", label: "در حال بررسی" },
  { value: "RESOLVED", label: "حل‌شده" },
];

export function AdminDashboard() {
  const { user, loading } = useAuth();
  const { openAuth } = useStoreDialogs();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [orders, setOrders] = useState<AdminOrderList | null>(null);
  const [orderFilter, setOrderFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<AdminReviewList | null>(null);
  const [reviewFilter, setReviewFilter] = useState<
    "all" | "pending" | "approved"
  >("pending");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [tickets, setTickets] = useState<ContactListResponse | null>(null);
  const [ticketFilter, setTicketFilter] = useState("");
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Products Management
  const [products, setProducts] = useState<ProductListResponse | null>(null);
  const [productFilterCat, setProductFilterCat] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);

  // Categories Management
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setSummaryError(null);
    try {
      setSummary(await getAdminSummary());
    } catch (error) {
      setSummaryError(errorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      setOrders(
        await getAdminOrders({
          status: orderFilter || undefined,
          search: orderQuery || undefined,
          page: orderPage,
        }),
      );
    } catch (error) {
      setOrdersError(errorMessage(error));
    } finally {
      setOrdersLoading(false);
    }
  }, [orderFilter, orderPage, orderQuery]);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      setReviews(await getAdminReviews({ status: reviewFilter, page: reviewPage }));
    } catch (error) {
      setReviewsError(errorMessage(error));
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewFilter, reviewPage]);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      setTickets(
        await getContactTickets(null, {
          status: ticketFilter || undefined,
          page: ticketPage,
        }),
      );
    } catch (error) {
      setTicketsError(errorMessage(error));
    } finally {
      setTicketsLoading(false);
    }
  }, [ticketFilter, ticketPage]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const list = await getCategories();
      setCategories(list);
    } catch (error) {
      setCategoriesError(errorMessage(error));
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await getProducts({
        search: productQuery || undefined,
        category: productFilterCat || undefined,
        limit: 12,
        offset: (productPage - 1) * 12,
      });
      setProducts(res);
    } catch (error) {
      setProductsError(errorMessage(error));
    } finally {
      setProductsLoading(false);
    }
  }, [productQuery, productFilterCat, productPage]);

  useEffect(() => {
    if (!isAdmin) return;
    // Data fetching effects intentionally flip loading state before awaiting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary(true);
    void loadCategories();
  }, [isAdmin, loadSummary, loadCategories]);

  useEffect(() => {
    if (!isAdmin || tab !== "orders") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders();
  }, [isAdmin, tab, loadOrders]);

  useEffect(() => {
    if (!isAdmin || tab !== "products") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [isAdmin, tab, loadProducts]);

  useEffect(() => {
    if (!isAdmin || tab !== "categories") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [isAdmin, tab, loadCategories]);

  useEffect(() => {
    if (!isAdmin || tab !== "reviews") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReviews();
  }, [isAdmin, tab, loadReviews]);

  useEffect(() => {
    if (!isAdmin || tab !== "tickets") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTickets();
  }, [isAdmin, tab, loadTickets]);

  function goToTab(next: Tab) {
    setTab(next);
  }

  async function changeOrderStatus(orderId: string, status: OrderStatus) {
    if (status === "CANCELLED") {
      const ok = window.confirm(
        "این سفارش لغو شود؟ موجودی کالاها به انبار برگردانده می‌شود.",
      );
      if (!ok) return;
    }
    setBusyId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      toast(`وضعیت سفارش به «${ORDER_STATUS[status].label}» تغییر کرد.`, "success");
      await Promise.all([loadOrders(), loadSummary(true)]);
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleReview(reviewId: string, approved: boolean) {
    setBusyId(reviewId);
    try {
      await setReviewApproval(reviewId, approved);
      toast(
        approved ? "نظر تأیید و منتشر شد." : "انتشار نظر برداشته شد.",
        "success",
      );
      await Promise.all([loadReviews(), loadSummary(true)]);
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function changeTicketStatus(ticketId: string, status: string) {
    setBusyId(ticketId);
    try {
      await updateContactStatus(ticketId, status);
      toast(
        `وضعیت پیام به «${TICKET_STATUS[status]?.label ?? status}» تغییر کرد.`,
        "success",
      );
      await Promise.all([loadTickets(), loadSummary(true)]);
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  }

  function submitOrderSearch(event: React.FormEvent) {
    event.preventDefault();
    setOrderPage(1);
    setOrderQuery(orderSearch.trim());
  }

  function submitProductSearch(event: React.FormEvent) {
    event.preventDefault();
    setProductPage(1);
    setProductQuery(productSearch.trim());
  }

  async function quickChangeStock(product: Product, delta: number) {
    const nextStock = Math.max(0, product.stock + delta);
    if (nextStock === product.stock) return;
    setStockUpdatingId(product.id);
    setProducts((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((p) =>
              p.id === product.id ? { ...p, stock: nextStock } : p,
            ),
          }
        : prev,
    );
    try {
      await updateProduct(null, product.id, { stock: nextStock });
      toast(`موجودی «${product.name}» به ${formatCount(nextStock)} عدد به‌روز شد.`, "success");
      void loadSummary(true);
    } catch (error) {
      toast(errorMessage(error), "error");
      void loadProducts();
    } finally {
      setStockUpdatingId(null);
    }
  }

  async function handleSaveProduct(dto: CreateProductInput, id?: string) {
    if (id) {
      await updateProduct(null, id, dto);
      toast("محصول با موفقیت ویرایش شد.", "success");
    } else {
      await createProduct(null, dto);
      toast("محصول جدید با موفقیت به کارگاه افزوده شد.", "success");
    }
    setProductModalOpen(false);
    setEditingProduct(null);
    await Promise.all([loadProducts(), loadSummary(true)]);
  }

  async function handleDeleteProduct(id: string, name: string) {
    const ok = window.confirm(`آیا از حذف محصول «${name}» اطمینان دارید؟`);
    if (!ok) return;
    setBusyId(id);
    try {
      await deleteProduct(null, id);
      toast(`محصول «${name}» با موفقیت حذف شد.`, "success");
      await Promise.all([loadProducts(), loadSummary(true)]);
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveCategory(dto: CreateCategoryInput, id?: string) {
    if (id) {
      await updateCategory(null, id, dto);
      toast("دسته‌بندی با موفقیت ویرایش شد.", "success");
    } else {
      await createCategory(null, dto);
      toast("دسته‌بندی جدید با موفقیت ساخته شد.", "success");
    }
    setCategoryModalOpen(false);
    setEditingCategory(null);
    await Promise.all([loadCategories(), loadProducts(), loadSummary(true)]);
  }

  async function handleDeleteCategory(id: string, name: string) {
    const ok = window.confirm(
      `آیا از حذف دسته‌بندی «${name}» اطمینان دارید؟ اگر محصولی متعلق به این دسته‌بندی باشد حذف نخواهد شد.`,
    );
    if (!ok) return;
    setBusyId(id);
    try {
      await deleteCategory(null, id);
      toast(`دسته‌بندی «${name}» با موفقیت حذف شد.`, "success");
      await Promise.all([loadCategories(), loadProducts(), loadSummary(true)]);
    } catch (error) {
      toast(errorMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 text-[var(--color-ink-soft)]">
        <Loader2 className="me-2 h-5 w-5 animate-spin" aria-hidden />
        در حال بررسی دسترسی…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="glass-card rounded-[28px] p-8 text-center">
          <span className="glass-pill mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-[var(--color-accent-strong)]">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold text-[var(--color-wood)]">
            این صفحه مخصوص مدیر کارگاه است
          </h1>
          <p className="mt-3 leading-relaxed text-[var(--color-ink-soft)]">
            {user
              ? "حساب شما دسترسی مدیریت ندارد. با حساب مدیر وارد شوید."
              : "برای دیدن سفارش‌ها، نظرات و پیام‌های مشتریان وارد شوید."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link href="/" className="btn btn-primary">
                بازگشت به فروشگاه
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openAuth({ redirect: "/admin" })}
              >
                ورود به حساب
              </button>
            )}
            <Link href="/" className="btn btn-ghost">
              صفحه اصلی
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <header className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white px-6 py-8 shadow-xs">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)]">
              <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
              پنل مدیریت و پایش کارگاه
            </span>
            <h1 className="text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
              داشبورد کارگاه
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              سلام {user.name}؛ وضعیت سفارش‌ها، موجودی انبار، نظرات منتظر تأیید و پیام‌های پشتیبانی را در یک نگاه بررسی کنید.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost text-xs font-semibold"
            onClick={() => {
              void loadSummary();
              if (tab === "orders") void loadOrders();
              if (tab === "products") void loadProducts();
              if (tab === "categories") void loadCategories();
              if (tab === "reviews") void loadReviews();
              if (tab === "tickets") void loadTickets();
            }}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden
            />
            به‌روزرسانی اطلاعات
          </button>
        </div>

        <div
          role="tablist"
          aria-label="بخش‌های پنل مدیریت"
          className="relative mt-6 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4"
        >
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`admin-tab-${item.id}`}
                aria-selected={active}
                aria-controls={`admin-panel-${item.id}`}
                onClick={() => goToTab(item.id)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-wood)] text-[var(--color-surface)] shadow-sm"
                    : "glass-pill text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
                {item.id === "reviews" && (summary?.pendingReviews ?? 0) > 0 && (
                  <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {formatCount(summary?.pendingReviews ?? 0)}
                  </span>
                )}
                {item.id === "tickets" && (summary?.newTickets ?? 0) > 0 && (
                  <span className="rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {formatCount(summary?.newTickets ?? 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div className="mt-6">
        {tab === "overview" && (
          <section
            role="tabpanel"
            id="admin-panel-overview"
            aria-labelledby="admin-tab-overview"
          >
            {summaryError && (
              <ErrorPanel message={summaryError} onRetry={() => void loadSummary()} />
            )}
            {!summary && !summaryError && <SkeletonPanel />}
            {summary && (
              <Overview
                summary={summary}
                onOpenOrders={() => goToTab("orders")}
                onOpenReviews={() => goToTab("reviews")}
                onOpenTickets={() => goToTab("tickets")}
              />
            )}
          </section>
        )}

        {tab === "orders" && (
          <section
            role="tabpanel"
            id="admin-panel-orders"
            aria-labelledby="admin-tab-orders"
            className="space-y-4"
          >
            <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex flex-wrap gap-1.5" aria-label="فیلتر وضعیت سفارش">
                {ORDER_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setOrderFilter(filter.value);
                      setOrderPage(1);
                    }}
                    aria-pressed={orderFilter === filter.value}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                      orderFilter === filter.value
                        ? "bg-[var(--color-wood)] text-[var(--color-surface)]"
                        : "glass-pill text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <form onSubmit={submitOrderSearch} className="flex items-center gap-2">
                <label htmlFor="admin-order-search" className="sr-only">
                  جستجوی سفارش
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]"
                    aria-hidden
                  />
                  <input
                    id="admin-order-search"
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder="شماره سفارش، ایمیل یا نام…"
                    className="glass-input w-56 py-2 pe-3 ps-9 text-sm"
                    maxLength={80}
                  />
                </div>
                <button type="submit" className="btn btn-ghost px-3 py-2 text-sm">
                  جستجو
                </button>
              </form>
            </div>

            {ordersError && (
              <ErrorPanel message={ordersError} onRetry={() => void loadOrders()} />
            )}
            {ordersLoading && !orders && <SkeletonPanel />}
            {orders && orders.items.length === 0 && (
              <EmptyPanel
                title="سفارشی پیدا نشد"
                hint="با تغییر فیلتر یا عبارت جستجو دوباره امتحان کنید."
              />
            )}
            {orders && orders.items.length > 0 && (
              <>
                <ul className="space-y-3">
                  {orders.items.map((order) => (
                    <li
                      key={order.id}
                      className="glass-card rounded-2xl p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-semibold text-[var(--color-wood)]" dir="ltr">
                            {order.orderNumber}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                            {order.customerName} ·{" "}
                            <span dir="ltr">{order.email}</span>
                          </p>
                          <p className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">
                            {formatDate(order.createdAt)} · {formatCount(order.itemCount)} قلم کالا
                          </p>
                          {order.note && (
                            <p className="mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs leading-6 text-[var(--color-ink-soft)]">
                              یادداشت مشتری: {order.note}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS[order.status].chip}`}
                          >
                            {ORDER_STATUS[order.status].label}
                          </span>
                          <span className="text-sm font-semibold text-[var(--color-wood)]">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>
                      <OrderActions
                        status={order.status}
                        busy={busyId === order.id}
                        onChange={(status) => void changeOrderStatus(order.id, status)}
                      />
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={orders.page}
                  hasMore={orders.hasMore}
                  total={orders.total}
                  onChange={setOrderPage}
                />
              </>
            )}
          </section>
        )}

        {tab === "products" && (
          <section
            role="tabpanel"
            id="admin-panel-products"
            aria-labelledby="admin-tab-products"
            className="space-y-4"
          >
            {/* Filter and Action Bar */}
            <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
                <form
                  onSubmit={submitProductSearch}
                  className="relative flex-1 min-w-[220px]"
                >
                  <Search
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="جستجو در عنوان، گونه چوب یا شناسه کالا…"
                    className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white pr-9 pl-4 text-xs font-medium text-[var(--color-ink)] shadow-2xs outline-none focus:border-[var(--color-accent)]"
                  />
                </form>
                <select
                  value={productFilterCat}
                  onChange={(e) => {
                    setProductFilterCat(e.target.value);
                    setProductPage(1);
                  }}
                  className="h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-xs font-medium text-[var(--color-ink)] shadow-2xs outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="">همه دسته‌بندی‌ها</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setProductModalOpen(true);
                }}
                className="btn btn-primary h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                افزودن محصول جدید
              </button>
            </div>

            {productsError && (
              <ErrorPanel
                message={productsError}
                onRetry={() => void loadProducts()}
              />
            )}
            {productsLoading && !products && <SkeletonPanel />}
            {products && products.items.length === 0 && (
              <EmptyPanel
                title="محصولی یافت نشد"
                hint="با تغییر عبارت جستجو یا دسته‌بندی دوباره امتحان کنید یا محصول جدیدی اضافه نمایید."
              />
            )}
            {products && products.items.length > 0 && (
              <>
                <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]">
                        <tr>
                          <th className="px-4 py-3 font-bold">قطعه چوبی</th>
                          <th className="px-3 py-3 font-bold">دسته‌بندی / گونه چوب</th>
                          <th className="px-3 py-3 font-bold">قیمت (تومان)</th>
                          <th className="px-3 py-3 font-bold text-center">
                            موجودی انبار کارگاه (کنترل سریع)
                          </th>
                          <th className="px-3 py-3 font-bold text-center">وضعیت</th>
                          <th className="px-4 py-3 font-bold text-left">مدیریت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {products.items.map((prod) => (
                          <tr
                            key={prod.id}
                            className="transition-colors hover:bg-[var(--color-surface-2)]/50"
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                                  {prod.images?.[0]?.url ? (
                                    <Image
                                      src={prod.images[0].url}
                                      alt={prod.name}
                                      fill
                                      className="object-cover"
                                      sizes="48px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[var(--color-ink-mute)]">
                                      <Boxes className="h-5 w-5 opacity-40" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-[var(--color-wood)]">
                                    {prod.name}
                                  </p>
                                  <p className="font-mono text-[11px] text-[var(--color-ink-mute)]" dir="ltr">
                                    {prod.sku}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-3.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-[var(--color-ink)]">
                                  {prod.category?.name ?? "—"}
                                </span>
                                <span className="text-[11px] text-[var(--color-ink-soft)]">
                                  {prod.woodType ?? "گونه چوب ثبت‌نشده"}
                                </span>
                              </div>
                            </td>

                            <td className="px-3 py-3.5">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-[var(--color-wood)]">
                                  {formatPrice(prod.price)}
                                </span>
                                {prod.compareAt && prod.compareAt > prod.price && (
                                  <span className="text-[11px] text-[var(--color-ink-mute)] line-through">
                                    {formatPrice(prod.compareAt)}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-3 py-3.5 text-center">
                              <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1">
                                <button
                                  type="button"
                                  onClick={() => void quickChangeStock(prod, -1)}
                                  disabled={prod.stock === 0 || stockUpdatingId === prod.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[var(--color-ink)] shadow-2xs transition-colors hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                                  title="کاهش یک عدد موجودی"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-10 text-center font-bold text-xs">
                                  {stockUpdatingId === prod.id ? (
                                    <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />
                                  ) : (
                                    formatCount(prod.stock)
                                  )}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void quickChangeStock(prod, 1)}
                                  disabled={stockUpdatingId === prod.id}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[var(--color-ink)] shadow-2xs transition-colors hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                                  title="افزایش یک عدد موجودی"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>

                            <td className="px-3 py-3.5 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                    prod.stock > 0
                                      ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
                                      : "border border-rose-300 bg-rose-50 text-rose-900"
                                  }`}
                                >
                                  {prod.stock > 0 ? "موجود" : "ناموجود"}
                                </span>
                                {prod.featured && (
                                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                    ویژه
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3.5 text-left">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/products/${prod.slug}`}
                                  target="_blank"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-neutral-100 hover:text-[var(--color-wood)]"
                                  title="مشاهده صفحه محصول در سایت"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(prod);
                                    setProductModalOpen(true);
                                  }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-neutral-100 hover:text-[var(--color-wood)] cursor-pointer"
                                  title="ویرایش کامل محصول"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === prod.id}
                                  onClick={() => void handleDeleteProduct(prod.id, prod.name)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
                                  title="حذف محصول"
                                >
                                  {busyId === prod.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Pagination
                  page={productPage}
                  hasMore={products.hasMore}
                  total={products.total}
                  onChange={setProductPage}
                />
              </>
            )}
          </section>
        )}

        {tab === "categories" && (
          <section
            role="tabpanel"
            id="admin-panel-categories"
            aria-labelledby="admin-tab-categories"
            className="space-y-4"
          >
            <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-wood)]">
                  دسته‌بندی‌های کارگاه نجاری
                </h3>
                <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
                  مدیریت شاخه‌های محصولات، اولویت نمایش و نام‌گذاری‌ها در وبسایت
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryModalOpen(true);
                }}
                className="btn btn-primary h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                افزودن دسته‌بندی جدید
              </button>
            </div>

            {categoriesError && (
              <ErrorPanel
                message={categoriesError}
                onRetry={() => void loadCategories()}
              />
            )}
            {categoriesLoading && !categories && <SkeletonPanel />}
            {categories && categories.length === 0 && (
              <EmptyPanel
                title="دسته‌بندی یافت نشد"
                hint="می‌توانید با دکمه بالا اولین دسته‌بندی را اضافه کنید."
              />
            )}
            {categories && categories.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]">
                      <tr>
                        <th className="px-4 py-3 font-bold">نام شاخه و تصویر</th>
                        <th className="px-3 py-3 font-bold">آدرس یکتا (Slug)</th>
                        <th className="px-3 py-3 font-bold">توضیحات</th>
                        <th className="px-4 py-3 font-bold text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {categories.map((cat) => (
                        <tr
                          key={cat.id}
                          className="transition-colors hover:bg-[var(--color-surface-2)]/50"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                                {cat.imageUrl ? (
                                  <Image
                                    src={cat.imageUrl}
                                    alt={cat.name}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[var(--color-ink-mute)]">
                                    <FolderTree className="h-4 w-4 opacity-40" />
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-[var(--color-wood)]">
                                {cat.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-xs text-[var(--color-ink-soft)]" dir="ltr">
                            {cat.slug}
                          </td>
                          <td className="px-3 py-3.5 text-[var(--color-ink-soft)] max-w-xs truncate">
                            {cat.description ?? "—"}
                          </td>
                          <td className="px-4 py-3.5 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setCategoryModalOpen(true);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-neutral-100 hover:text-[var(--color-wood)] cursor-pointer"
                                title="ویرایش دسته‌بندی"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={busyId === cat.id}
                                onClick={() => void handleDeleteCategory(cat.id, cat.name)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
                                title="حذف دسته‌بندی"
                              >
                                {busyId === cat.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === "reviews" && (
          <section
            role="tabpanel"
            id="admin-panel-reviews"
            aria-labelledby="admin-tab-reviews"
            className="space-y-4"
          >
            <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex gap-1.5" aria-label="فیلتر وضعیت نظرات">
                {(
                  [
                    { value: "pending", label: "در انتظار تأیید" },
                    { value: "approved", label: "تأییدشده" },
                    { value: "all", label: "همه" },
                  ] as const
                ).map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setReviewFilter(filter.value);
                      setReviewPage(1);
                    }}
                    aria-pressed={reviewFilter === filter.value}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                      reviewFilter === filter.value
                        ? "bg-[var(--color-wood)] text-[var(--color-surface)]"
                        : "glass-pill text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-[var(--color-ink-soft)]">
                {formatCount(summary?.pendingReviews ?? 0)} نظر در انتظار تأیید
              </p>
            </div>

            {reviewsError && (
              <ErrorPanel message={reviewsError} onRetry={() => void loadReviews()} />
            )}
            {reviewsLoading && !reviews && <SkeletonPanel />}
            {reviews && reviews.items.length === 0 && (
              <EmptyPanel
                title="نظری در این دسته نیست"
                hint="نظرات جدید مشتریان پس از ثبت، اینجا برای تأیید نمایش داده می‌شوند."
              />
            )}
            {reviews && reviews.items.length > 0 && (
              <>
                <ul className="space-y-3">
                  {reviews.items.map((review) => (
                    <li key={review.id} className="glass-card rounded-2xl p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {review.product.image ? (
                            <Image
                              src={review.product.image}
                              alt=""
                              width={48}
                              height={48}
                              unoptimized
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-2)]">
                              <Package className="h-5 w-5 text-[var(--color-ink-soft)]" aria-hidden />
                            </span>
                          )}
                          <div>
                            <Link
                              href={`/products/${review.product.slug}`}
                              className="font-semibold text-[var(--color-wood)] hover:text-[var(--color-accent-strong)]"
                            >
                              {review.product.name}
                            </Link>
                            <p className="mt-0.5 text-xs font-medium text-[var(--color-ink-soft)]">
                              {review.user.name} · {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" role="img" aria-label={`امتیاز ${review.rating} از ۵`}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                              key={value}
                              className={`h-4 w-4 ${
                                value <= review.rating
                                  ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                                  : "text-[var(--color-border-strong)]"
                              }`}
                              aria-hidden
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && (
                        <p className="mt-3 font-semibold text-[var(--color-wood)]">
                          {review.title}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm leading-7 text-[var(--color-ink-soft)]">
                        {review.body}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            review.approved
                              ? ORDER_STATUS.DELIVERED.chip
                              : ORDER_STATUS.PENDING.chip
                          }`}
                        >
                          {review.approved ? "تأییدشده و منتشر" : "در انتظار تأیید"}
                        </span>
                        <button
                          type="button"
                          className={`btn px-3 py-2 text-sm ${
                            review.approved ? "btn-ghost" : "btn-primary"
                          }`}
                          disabled={busyId === review.id}
                          onClick={() => void toggleReview(review.id, !review.approved)}
                        >
                          {busyId === review.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : review.approved ? (
                            <X className="h-4 w-4" aria-hidden />
                          ) : (
                            <Check className="h-4 w-4" aria-hidden />
                          )}
                          {review.approved ? "لغو انتشار" : "تأیید و انتشار"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={reviews.page}
                  hasMore={reviews.hasMore}
                  total={reviews.total}
                  onChange={setReviewPage}
                />
              </>
            )}
          </section>
        )}

        {tab === "tickets" && (
          <section
            role="tabpanel"
            id="admin-panel-tickets"
            aria-labelledby="admin-tab-tickets"
            className="space-y-4"
          >
            <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex flex-wrap gap-1.5" aria-label="فیلتر وضعیت پیام‌ها">
                {TICKET_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setTicketFilter(filter.value);
                      setTicketPage(1);
                    }}
                    aria-pressed={ticketFilter === filter.value}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                      ticketFilter === filter.value
                        ? "bg-[var(--color-wood)] text-[var(--color-surface)]"
                        : "glass-pill text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-[var(--color-ink-soft)]">
                {formatCount(summary?.newTickets ?? 0)} پیام خوانده‌نشده
              </p>
            </div>

            {ticketsError && (
              <ErrorPanel message={ticketsError} onRetry={() => void loadTickets()} />
            )}
            {ticketsLoading && !tickets && <SkeletonPanel />}
            {tickets && tickets.items.length === 0 && (
              <EmptyPanel
                title="پیامی پیدا نشد"
                hint="پیام‌های فرم تماس و استعلام‌های مشتریان اینجا جمع می‌شوند."
              />
            )}
            {tickets && tickets.items.length > 0 && (
              <>
                <ul className="space-y-3">
                  {tickets.items.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      busy={busyId === ticket.id}
                      onStatusChange={(status) => void changeTicketStatus(ticket.id, status)}
                    />
                  ))}
                </ul>
                <Pagination
                  page={tickets.page}
                  hasMore={tickets.hasMore}
                  total={tickets.total}
                  onChange={setTicketPage}
                />
              </>
            )}
          </section>
        )}
      </div>

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories ?? []}
        onSave={handleSaveProduct}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

function Overview({
  summary,
  onOpenOrders,
  onOpenReviews,
  onOpenTickets,
}: {
  summary: AdminSummary;
  onOpenOrders: () => void;
  onOpenReviews: () => void;
  onOpenTickets: () => void;
}) {
  const maxDay = Math.max(1, ...summary.salesByDay.map((day) => day.total));
  const totalOrders = Object.values(summary.ordersByStatus).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="درآمد تأییدشده"
          value={formatPrice(summary.revenue)}
          icon={BarChart3}
          hint={`${formatCount(summary.paidOrders)} سفارش پرداخت‌شده`}
          tone="wood"
        />
        <StatCard
          label="سفارش‌ها"
          value={formatCount(totalOrders)}
          icon={Package}
          hint={`${formatCount(summary.ordersByStatus.PENDING)} در انتظار اقدام`}
        />
        <StatCard
          label="مشتریان"
          value={formatCount(summary.customers)}
          icon={Users}
          hint={`${formatCount(summary.products)} محصول فعال`}
        />
        <StatCard
          label="کارهای باز"
          value={formatCount(summary.pendingReviews + summary.newTickets)}
          icon={CircleAlert}
          hint={`${formatCount(summary.pendingReviews)} نظر، ${formatCount(summary.newTickets)} پیام`}
          tone="accent"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="glass-card rounded-2xl p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-wood)]">
              فروش هفت روز اخیر
            </h2>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--color-ink-soft)]">
              سفارش‌های پرداخت‌شده
            </span>
          </div>
          <div
            className="mt-6 flex h-52 items-stretch gap-2 sm:gap-3"
            role="img"
            aria-label={`نمودار فروش هفت روز اخیر؛ بیشترین روز ${formatPrice(maxDay)}`}
          >
            {summary.salesByDay.map((day) => {
              const height =
                day.total === 0 ? 4 : Math.max(8, Math.round((day.total / maxDay) * 100));
              return (
                <div key={day.date} className="group flex h-full flex-1 flex-col items-center">
                  <span className="mb-1 text-[11px] font-bold text-[var(--color-ink-soft)] opacity-0 transition-opacity group-hover:opacity-100">
                    {day.total > 0 ? formatPrice(day.total) : "—"}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-xl bg-[var(--color-accent)] transition-all group-hover:bg-[var(--color-accent-strong)]"
                      style={{ height: `${height}%` }}
                      title={`${formatDate(day.date)} — ${day.total > 0 ? formatPrice(day.total) : "بدون فروش"}`}
                    />
                  </div>
                  <span className="mt-2 text-xs font-medium text-[var(--color-ink-soft)]">
                    {formatDate(day.date).split(" ").slice(0, 2).join(" ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-[var(--color-wood)]">
            وضعیت سفارش‌ها
          </h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]">
            {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((status) => {
              const count = summary.ordersByStatus[status];
              const width = totalOrders ? (count / totalOrders) * 100 : 0;
              if (!count) return null;
              return (
                <span
                  key={status}
                  className={`${ORDER_STATUS[status].chip} border-0`}
                  style={{ width: `${width}%` }}
                  title={`${ORDER_STATUS[status].label}: ${formatCount(count)}`}
                />
              );
            })}
          </div>
          <ul className="mt-5 space-y-2.5">
            {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((status) => (
              <li
                key={status}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                  <span
                    className={`h-2.5 w-2.5 rounded-full border ${ORDER_STATUS[status].chip}`}
                    aria-hidden
                  />
                  {ORDER_STATUS[status].label}
                </span>
                <span className="font-semibold text-[var(--color-wood)]">
                  {formatCount(summary.ordersByStatus[status])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-wood)]">
              آخرین سفارش‌ها
            </h2>
            <button
              type="button"
              onClick={onOpenOrders}
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[var(--color-accent-strong)]"
            >
              همه سفارش‌ها <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <ul className="space-y-2">
            {summary.recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-[var(--color-wood)]" dir="ltr">
                    {order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-[var(--color-ink-soft)]">
                    {order.customerName} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--color-wood)]">
                    {formatPrice(order.total)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ORDER_STATUS[order.status].chip}`}
                  >
                    {ORDER_STATUS[order.status].label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--color-wood)]">
              موجودی رو به اتمام
            </h2>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={onOpenReviews}
                className="inline-flex cursor-pointer items-center gap-1 font-medium text-[var(--color-accent-strong)]"
              >
                نظرات <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={onOpenTickets}
                className="inline-flex cursor-pointer items-center gap-1 font-medium text-[var(--color-accent-strong)]"
              >
                پیام‌ها <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
          {summary.lowStock.length === 0 ? (
            <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-4 text-sm font-medium text-[var(--color-ink-soft)]">
              موجودی همه محصولات در محدوده سالم است.
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.lowStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2"
                >
                  <span className="flex items-center gap-3">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-[var(--color-border)]">
                        <Package className="h-4 w-4 text-[var(--color-ink-soft)]" aria-hidden />
                      </span>
                    )}
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm font-medium text-[var(--color-wood)] hover:text-[var(--color-accent-strong)]"
                    >
                      {product.name}
                    </Link>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      product.stock <= 2
                        ? "text-[var(--color-error)]"
                        : "text-[var(--color-accent-strong)]"
                    }`}
                  >
                    {product.stock <= 2 && (
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {formatCount(product.stock)} عدد
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof BarChart3;
  tone?: "neutral" | "wood" | "accent";
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-ink-soft)]">{label}</p>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tone === "wood"
              ? "bg-[rgba(122,65,25,0.12)] text-[var(--color-accent-strong)]"
              : tone === "accent"
                ? "bg-[rgba(38,78,24,0.12)] text-[var(--color-success)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]"
          }`}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold text-[var(--color-wood)] sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">{hint}</p>
    </div>
  );
}

function OrderActions({
  status,
  busy,
  onChange,
}: {
  status: OrderStatus;
  busy: boolean;
  onChange: (status: OrderStatus) => void;
}) {
  const actions: { status: OrderStatus; label: string; className: string }[] = [];
  if (status === "PENDING") {
    actions.push({ status: "PAID", label: "تأیید پرداخت", className: "btn-primary" });
    actions.push({ status: "CANCELLED", label: "لغو سفارش", className: "btn-ghost" });
  } else if (status === "PAID") {
    actions.push({ status: "SHIPPED", label: "ثبت ارسال", className: "btn-primary" });
    actions.push({ status: "CANCELLED", label: "لغو سفارش", className: "btn-ghost" });
  } else if (status === "SHIPPED") {
    actions.push({ status: "DELIVERED", label: "تحویل شد", className: "btn-primary" });
  }

  if (!actions.length) {
    return (
      <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs font-medium text-[var(--color-ink-soft)]">
        این سفارش در وضعیت نهایی است.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          disabled={busy}
          onClick={() => onChange(action.status)}
          className={`btn px-3 py-2 text-sm ${action.className}`}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {action.label}
        </button>
      ))}
    </div>
  );
}

function TicketCard({
  ticket,
  busy,
  onStatusChange,
}: {
  ticket: ContactTicket;
  busy: boolean;
  onStatusChange: (status: string) => void;
}) {
  const status = TICKET_STATUS[ticket.status] ?? TICKET_STATUS.NEW;
  return (
    <li className="glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[var(--color-wood)]">{ticket.subject}</h3>
          <p className="mt-1 text-xs font-medium text-[var(--color-ink-soft)]">
            {ticket.name} · {formatDate(ticket.createdAt)}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.chip}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">
        {ticket.message}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <a
          href={`mailto:${ticket.email}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent-strong)]"
          dir="ltr"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {ticket.email}
        </a>
        <div className="flex flex-wrap gap-2">
          {ticket.status !== "IN_PROGRESS" && ticket.status !== "RESOLVED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onStatusChange("IN_PROGRESS")}
              className="btn btn-ghost px-3 py-2 text-sm"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              شروع بررسی
            </button>
          )}
          {ticket.status !== "RESOLVED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onStatusChange("RESOLVED")}
              className="btn btn-primary px-3 py-2 text-sm"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              حل شد
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function Pagination({
  page,
  hasMore,
  total,
  onChange,
}: {
  page: number;
  hasMore: boolean;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-1 text-sm">
      <span className="font-medium text-[var(--color-ink-soft)]">
        {formatCount(total)} مورد · صفحه {formatCount(page)}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-ghost px-3 py-2 text-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          قبلی
        </button>
        <button
          type="button"
          className="btn btn-ghost px-3 py-2 text-sm"
          disabled={!hasMore}
          onClick={() => onChange(page + 1)}
        >
          بعدی
        </button>
      </div>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div
      className="glass-card flex items-center justify-center gap-2 rounded-2xl p-12 text-sm text-[var(--color-ink-soft)]"
      role="status"
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      در حال بارگذاری…
    </div>
  );
}

function EmptyPanel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="glass-card rounded-2xl p-10 text-center">
      <Check className="mx-auto h-8 w-8 text-[var(--color-accent)]" aria-hidden />
      <p className="mt-3 font-semibold text-[var(--color-wood)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{hint}</p>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[rgba(154,58,43,0.25)] p-4 text-sm text-[var(--color-error)]"
    >
      <span className="flex items-center gap-2">
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
        {message}
      </span>
      <button type="button" className="btn btn-ghost px-3 py-2 text-sm" onClick={onRetry}>
        تلاش دوباره
      </button>
    </div>
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "دریافت اطلاعات ناموفق بود. دوباره تلاش کنید.";
}
