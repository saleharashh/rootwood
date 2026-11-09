import React, { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Package,
  Plus,
  Shield,
  ShoppingBag,
  Star,
  Users,
  X,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  api,
  type AdminSummary,
  type Order,
  type Review,
  type ContactMessage,
  type Category,
  type Product,
} from "@/lib/api";
import { formatPriceToman, toPersianDigits, formatJalaliDate } from "@/lib/price";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار پرداخت", color: "bg-amber-50 text-amber-800 border-amber-200" },
  PAID: { label: "پرداخت شده (نوبت کارگاه)", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  PROCESSING: { label: "در حال ساخت و نجاری", color: "bg-blue-50 text-blue-800 border-blue-200" },
  SHIPPED: { label: "ارسال‌شده با باربری", color: "bg-purple-50 text-purple-800 border-purple-200" },
  DELIVERED: { label: "تحویل‌شده به مشتری", color: "bg-stone-100 text-stone-800 border-stone-200" },
  CANCELLED: { label: "لغو شده", color: "bg-red-50 text-red-800 border-red-200" },
};

export function Admin() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "products" | "reviews" | "contacts">("dashboard");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [prodSearch, setProdSearch] = useState("");
  const [prodCatFilter, setProdCatFilter] = useState("ALL");

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodTitle, setProdTitle] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("5");
  const [prodWood, setProdWood] = useState("گردوی سیاه");
  const [prodDimensions, setProdDimensions] = useState("۱۸۰ × ۸۵ × ۷۵ سانتی‌متر");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("/images/workshop.webp");
  const [submittingProd, setSubmittingProd] = useState(false);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sumRes, ordRes, prodRes, revRes, msgRes, catRes] = await Promise.all([
        api.getAdminSummary().catch(() => null),
        api.getAdminOrders({ limit: 100 }).catch(() => ({ orders: [] })),
        api.getProducts({ limit: 100 }).catch(() => ({ items: [] })),
        api.getAdminReviews().catch(() => ({ reviews: [] })),
        api.getAdminContacts().catch(() => ({ messages: [] })),
        api.getCategories().catch(() => ({ categories: [] })),
      ]);

      if (sumRes) setSummary(sumRes);
      if (ordRes) setOrders(ordRes.orders || []);
      if (prodRes) setProducts(prodRes.items || []);
      if (revRes) setReviews(revRes.reviews || []);
      if (msgRes) setContacts(msgRes.messages || []);
      if (catRes) {
        setCategories(catRes.categories || []);
        if (catRes.categories.length > 0 && !prodCategoryId) {
          setProdCategoryId(catRes.categories[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
    showToast("اطلاعات پنل مدیریت به‌روزرسانی شد", "success");
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast("وضعیت سفارش با موفقیت به‌روزرسانی شد", "success");
      const res = await api.getAdminOrders({ limit: 100 });
      setOrders(res.orders || []);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در تغییر وضعیت سفارش", "error");
    }
  };

  const handleReviewApproval = async (reviewId: string, approved: boolean) => {
    try {
      await api.updateReviewApproval(reviewId, approved);
      showToast(approved ? "دیدگاه تأیید و در سایت منتشر شد" : "دیدگاه رد و حذف شد", "success");
      const res = await api.getAdminReviews();
      setReviews(res.reviews || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در بررسی دیدگاه", "error");
    }
  };

  const handleContactStatus = async (id: string, status: "UNREAD" | "READ" | "REPLIED") => {
    try {
      await api.updateContactStatus(id, status);
      showToast("وضعیت پیام تغییر کرد", "success");
      const res = await api.getAdminContacts();
      setContacts(res.messages || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در به‌روزرسانی وضعیت پیام", "error");
    }
  };

  const handleQuickStockChange = async (prodId: string, delta: number) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + delta);
    try {
      await api.updateProduct(prodId, { stock: newStock });
      setProducts(products.map((p) => (p.id === prodId ? { ...p, stock: newStock } : p)));
      showToast(`موجودی ${prod.name || prod.title} به ${toPersianDigits(newStock)} تغییر یافت`, "success");
    } catch {
      showToast("خطا در به‌روزرسانی موجودی انبار", "error");
    }
  };

  const handleToggleProductFeatured = async (prodId: string, current: boolean) => {
    try {
      await api.updateProduct(prodId, { featured: !current });
      setProducts(products.map((p) => (p.id === prodId ? { ...p, featured: !current } : p)));
      showToast(!current ? "اثر به ویترین پرفروش‌ها اضافه شد" : "اثر از ویترین پرفروش‌ها برداشته شد", "success");
    } catch {
      showToast("خطا در تغییر وضعیت ویترین", "error");
    }
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingEdit(true);
    try {
      await api.updateProduct(editingProduct.id, {
        price: parseInt(editPrice, 10) || editingProduct.price,
        stock: parseInt(editStock, 10) || editingProduct.stock,
      });
      showToast("مشخصات اثر با موفقیت ذخیره شد", "success");
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                price: parseInt(editPrice, 10) || p.price,
                stock: parseInt(editStock, 10) || p.stock,
              }
            : p
        )
      );
      setEditingProduct(null);
    } catch {
      showToast("خطا در ویرایش اثر", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodPrice.trim()) {
      showToast("عنوان و قیمت اثر الزامی است", "error");
      return;
    }

    setSubmittingProd(true);
    try {
      const generatedSlug = prodSlug.trim() || prodTitle.trim().toLowerCase().replace(/[\s\W-]+/g, "-");
      await api.createProduct({
        title: prodTitle.trim(),
        name: prodTitle.trim(),
        slug: generatedSlug,
        categoryId: prodCategoryId,
        price: parseInt(prodPrice, 10),
        stock: parseInt(prodStock, 10) || 1,
        woodType: prodWood.trim(),
        dimensions: prodDimensions.trim(),
        shortDescription: prodDescription.trim().slice(0, 150),
        description: prodDescription.trim(),
        imageUrl: prodImageUrl.trim() || "/images/workshop.webp",
        images: [prodImageUrl.trim() || "/images/workshop.webp"],
        sku: "RW-" + Math.floor(Math.random() * 9000 + 1000),
      });
      showToast("دست‌سازه جدید با موفقیت در کاتالوگ ثبت شد", "success");
      setShowAddProduct(false);
      setProdTitle("");
      setProdSlug("");
      setProdPrice("");
      setProdDescription("");
      loadInitialData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت محصول", "error");
    } finally {
      setSubmittingProd(false);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !orderSearch.trim() ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase())) ||
        o.recipientName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.phone.includes(orderSearch);

      const matchStatus = orderStatusFilter === "ALL" || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = p.name || p.title || "";
      const matchSearch =
        !prodSearch.trim() ||
        name.toLowerCase().includes(prodSearch.toLowerCase()) ||
        (p.woodType && p.woodType.toLowerCase().includes(prodSearch.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(prodSearch.toLowerCase()));

      const matchCat = prodCatFilter === "ALL" || p.categoryId === prodCatFilter || p.category?.id === prodCatFilter || p.category?.slug === prodCatFilter;
      return matchSearch && matchCat;
    });
  }, [products, prodSearch, prodCatFilter]);

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#faf8f5]">
        <div className="w-10 h-10 border-4 border-[#b85d19]/20 border-t-[#b85d19] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-[#2b1e17] font-serif">دسترسی مدیریت محدود است</h1>
        <p className="text-[#655347] text-xs sm:text-sm leading-relaxed">
          این بخش تنها مختص مدیران آتلیه روت‌وود می‌باشد. برای ورود با شناسه مدیر لاگین فرمایید.
        </p>
        <Link href="/">
          <Button variant="default" className="mt-2">بازگشت به فروشگاه</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f5] min-h-[85vh] pb-24">
      {/* ========================================================================= */}
      {/* 1. TOP STUDIO ADMIN HEADER                                                */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-[#e8ded3] sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#b85d19] flex items-center justify-center text-white font-bold shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black font-serif text-[#2b1e17]">
                  میز مدیریت آتلیه روت‌وود
                </h1>
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline-block text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  متصل به کارگاه
                </span>
              </div>
              <p className="text-xs text-[#8c796e]">
                کنترل متمرکز سفارش‌ها، فرآیند نجاری، انبارداری و کاتالوگ آثار
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">تازه‌سازی</span>
            </Button>

            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>مشاهده سایت</span>
              </Button>
            </Link>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setShowAddProduct(true)}
              className="gap-1.5 text-xs h-9 font-bold bg-[#b85d19] hover:bg-[#9e4e13]"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن دست‌سازه جدید</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs Bar (Responsive horizontal scroll) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar border-t border-[#f0e7dd]">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === "dashboard"
                  ? "bg-[#b85d19] text-white shadow-xs"
                  : "text-[#655347] hover:bg-[#f4ece4] hover:text-[#2b1e17]"
              }`}
            >
              <span>داشبورد و آمار</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-[#b85d19] text-white shadow-xs"
                  : "text-[#655347] hover:bg-[#f4ece4] hover:text-[#2b1e17]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>سفارش‌ها</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "orders" ? "bg-white/20 text-white" : "bg-[#f4ece4] text-[#655347]"
              }`}>
                {toPersianDigits(orders.length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === "products"
                  ? "bg-[#b85d19] text-white shadow-xs"
                  : "text-[#655347] hover:bg-[#f4ece4] hover:text-[#2b1e17]"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>کاتالوگ و انبار</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "products" ? "bg-white/20 text-white" : "bg-[#f4ece4] text-[#655347]"
              }`}>
                {toPersianDigits(products.length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === "reviews"
                  ? "bg-[#b85d19] text-white shadow-xs"
                  : "text-[#655347] hover:bg-[#f4ece4] hover:text-[#2b1e17]"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>دیدگاه‌های کاربران</span>
              {reviews.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "reviews" ? "bg-white/20 text-white" : "bg-[#fdf1e7] text-[#b85d19]"
                }`}>
                  {toPersianDigits(reviews.length)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("contacts")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === "contacts"
                  ? "bg-[#b85d19] text-white shadow-xs"
                  : "text-[#655347] hover:bg-[#f4ece4] hover:text-[#2b1e17]"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>پیام‌ها و سفارشی‌سازی</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "contacts" ? "bg-white/20 text-white" : "bg-[#f4ece4] text-[#655347]"
              }`}>
                {toPersianDigits(contacts.length)}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD OVERVIEW & KPIS                                          */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 4 Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-[#e8ded3] shadow-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8c796e] font-medium">مجموع فروش و درآمد نقدی</p>
                  <h2 className="text-xl sm:text-2xl font-black font-serif text-[#2b1e17] mt-1">
                    {formatPriceToman(summary?.totalRevenue || summary?.revenue || 0)}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#fdf1e7] text-[#b85d19] flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#e8ded3] shadow-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8c796e] font-medium">سفارش‌های تسویه شده</p>
                  <h2 className="text-xl sm:text-2xl font-black font-serif text-[#2b1e17] mt-1">
                    {toPersianDigits(summary?.paidOrders || 0)} سفارش
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#e8ded3] shadow-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8c796e] font-medium">مشتریان ثبت‌شده</p>
                  <h2 className="text-xl sm:text-2xl font-black font-serif text-[#2b1e17] mt-1">
                    {toPersianDigits(summary?.customers || 0)} کاربر
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#f4ece4] text-[#2b1e17] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-[#e8ded3] shadow-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#8c796e] font-medium">در نوبت کارگاه و نجاری</p>
                  <h2 className="text-xl sm:text-2xl font-black font-serif text-[#b85d19] mt-1">
                    {toPersianDigits((summary?.ordersByStatus?.PENDING || 0) + (summary?.ordersByStatus?.PROCESSING || 0))} اثر
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Status Pipeline Grid */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e8ded3] shadow-card space-y-4">
              <h3 className="text-base font-bold font-serif text-[#2b1e17]">
                گردش کار و وضعیت سفارش‌ها در زنجیره ساخت
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                {Object.entries(ORDER_STATUSES).map(([key, info]) => {
                  const count = summary?.ordersByStatus?.[key] || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setOrderStatusFilter(key);
                        setActiveTab("orders");
                      }}
                      className="p-3.5 rounded-2xl border border-[#e8ded3] bg-[#faf8f5] hover:bg-[#fdf1e7] hover:border-[#b85d19]/40 transition text-right space-y-1"
                    >
                      <span className="text-[11px] font-bold text-[#655347] block leading-tight">{info.label}</span>
                      <div className="text-xl font-black font-serif text-[#2b1e17]">
                        {toPersianDigits(count)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Low Stock Alerts */}
            {summary?.lowStock && summary.lowStock.length > 0 && (
              <div className="bg-[#fdf1e7] border border-[#edd1bc] p-6 rounded-3xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#b85d19] font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>هشدار کسری موجودی انبار کارگاه (۳ عدد یا کمتر)</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="text-xs font-bold text-[#b85d19] hover:underline"
                  >
                    مدیریت انبار آثار ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {summary.lowStock.map((ls) => (
                    <div
                      key={ls.id}
                      className="bg-white p-4 rounded-2xl border border-[#edd1bc] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#2b1e17]">{ls.title || ls.name}</div>
                        <div className="text-[11px] text-red-700 font-semibold mt-0.5">
                          موجودی باقی‌مانده: {toPersianDigits(ls.stock)} عدد
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickStockChange(ls.id, 5)}
                        className="text-xs h-8 px-2.5 shrink-0"
                      >
                        +۵ افزایش
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ORDERS MANAGEMENT                                                  */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-3xl border border-[#e8ded3] shadow-card p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
            {/* Header + Search & Filter Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#f0e7dd] pb-5">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#2b1e17]">
                  مدیریت سفارش‌ها و رهگیری بارنامه
                </h2>
                <p className="text-xs text-[#8c796e] mt-0.5">
                  نمایش {toPersianDigits(filteredOrders.length)} سفارش از مجموع {toPersianDigits(orders.length)}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#8c796e] absolute right-3 top-3" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="جستجوی نام، تلفن، کد سفارش..."
                    className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-[#e8ded3] bg-[#faf8f5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2.5 rounded-xl border border-[#e8ded3] bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30 font-semibold text-[#2b1e17]"
                >
                  <option value="ALL">تمامی وضعیت‌ها</option>
                  <option value="PENDING">در انتظار پرداخت</option>
                  <option value="PAID">پرداخت شده (نوبت کارگاه)</option>
                  <option value="PROCESSING">در حال ساخت و نجاری</option>
                  <option value="SHIPPED">ارسال‌شده با باربری</option>
                  <option value="DELIVERED">تحویل‌شده به مشتری</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>
              </div>
            </div>

            {/* Orders Content */}
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Package className="w-12 h-12 text-[#8c796e] mx-auto opacity-40" />
                <p className="text-sm text-[#655347]">سفارشی مطابق با فیلترهای جستجو یافت نشد.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[#e8ded3] bg-[#faf8f5] text-[#655347] font-semibold">
                        <th className="p-3.5 rounded-r-xl">کد سفارش</th>
                        <th className="p-3.5">خریدار و تماس</th>
                        <th className="p-3.5">تاریخ ثبت</th>
                        <th className="p-3.5">مبلغ کل</th>
                        <th className="p-3.5">وضعیت ساخت و ارسال</th>
                        <th className="p-3.5">تغییر وضعیت</th>
                        <th className="p-3.5 rounded-l-xl text-center">جزئیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0e7dd]">
                      {filteredOrders.map((o) => {
                        const st = ORDER_STATUSES[o.status] || {
                          label: o.status,
                          color: "bg-stone-100 text-stone-800",
                        };

                        return (
                          <tr key={o.id} className="hover:bg-[#fdf1e7]/40 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-[#2b1e17]">
                              {o.orderNumber || o.id.slice(0, 10)}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-[#2b1e17]">{o.recipientName}</div>
                              <div className="text-[#8c796e] text-[11px] font-mono mt-0.5">{o.phone || o.user?.phone || "—"}</div>
                            </td>
                            <td className="p-3.5 text-[#655347]">{formatJalaliDate(o.createdAt)}</td>
                            <td className="p-3.5 font-bold text-sm text-[#b85d19] font-serif">
                              {formatPriceToman(o.totalAmount || o.total || 0)}
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${st.color}`}>
                                {st.label}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#e8ded3] bg-white focus:outline-none focus:border-[#b85d19] font-medium"
                              >
                                <option value="PENDING">در انتظار پرداخت</option>
                                <option value="PAID">پرداخت شده</option>
                                <option value="PROCESSING">در حال ساخت و نجاری</option>
                                <option value="SHIPPED">ارسال‌شده با باربری</option>
                                <option value="DELIVERED">تحویل‌شده به مشتری</option>
                                <option value="CANCELLED">لغو شده</option>
                              </select>
                            </td>
                            <td className="p-3.5 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrder(o)}
                                className="h-8 px-2.5 text-xs gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>مشاهده</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile & Tablet Card View (Fully Responsive!) */}
                <div className="lg:hidden space-y-4">
                  {filteredOrders.map((o) => {
                    const st = ORDER_STATUSES[o.status] || {
                      label: o.status,
                      color: "bg-stone-100 text-stone-800",
                    };

                    return (
                      <div
                        key={o.id}
                        className="p-4 rounded-2xl border border-[#e8ded3] bg-[#faf8f5]/60 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#2b1e17]">
                            {o.orderNumber || o.id.slice(0, 10)}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${st.color}`}>
                            {st.label}
                          </span>
                        </div>

                        <div className="flex justify-between items-baseline text-xs text-[#655347]">
                          <div>
                            <span className="font-bold text-[#2b1e17]">{o.recipientName}</span>
                            <span className="text-[#8c796e] block font-mono text-[11px]">{o.phone || "—"}</span>
                          </div>
                          <div className="text-left font-serif font-bold text-sm text-[#b85d19]">
                            {formatPriceToman(o.totalAmount || o.total || 0)}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#e8ded3] flex items-center justify-between gap-2">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="text-xs px-2.5 py-1.5 rounded-xl border border-[#e8ded3] bg-white flex-1"
                          >
                            <option value="PENDING">در انتظار پرداخت</option>
                            <option value="PAID">پرداخت شده</option>
                            <option value="PROCESSING">در حال ساخت و نجاری</option>
                            <option value="SHIPPED">ارسال‌شده با باربری</option>
                            <option value="DELIVERED">تحویل‌شده به مشتری</option>
                            <option value="CANCELLED">لغو شده</option>
                          </select>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(o)}
                            className="h-8 text-xs shrink-0"
                          >
                            جزئیات
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PRODUCT CATALOG & WORKSHOP INVENTORY (NEW!)                        */}
        {/* ========================================================================= */}
        {activeTab === "products" && (
          <div className="bg-white rounded-3xl border border-[#e8ded3] shadow-card p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
            {/* Header Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#f0e7dd] pb-5">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#2b1e17]">
                  کاتالوگ آثار و مدیریت موجودی انبار
                </h2>
                <p className="text-xs text-[#8c796e] mt-0.5">
                  کنترل موجودی آماده، قیمت‌گذاری و معرفی شاهکارهای برگزیده
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#8c796e] absolute right-3 top-3" />
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    placeholder="جستجوی نام اثر، چوب، کد..."
                    className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-[#e8ded3] bg-[#faf8f5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>

                <select
                  value={prodCatFilter}
                  onChange={(e) => setProdCatFilter(e.target.value)}
                  className="text-xs px-3 py-2.5 rounded-xl border border-[#e8ded3] bg-[#faf8f5] focus:outline-none font-semibold text-[#2b1e17]"
                >
                  <option value="ALL">تمامی دسته‌ها</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={() => setShowAddProduct(true)}
                  className="gap-1.5 text-xs bg-[#b85d19] hover:bg-[#9e4e13]"
                >
                  <Plus className="w-4 h-4" />
                  <span>اثر جدید</span>
                </Button>
              </div>
            </div>

            {/* Products Grid & List */}
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Layers className="w-12 h-12 text-[#8c796e] mx-auto opacity-40" />
                <p className="text-sm text-[#655347]">اثری با این مشخصات در انبار یافت نشد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  const img = p.images?.[0]?.url || p.imageUrl || "/images/workshop.webp";

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-[#e8ded3] bg-[#faf8f5]/60 hover:bg-white hover:border-[#b85d19]/40 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f4ece4] border border-[#e8ded3] shrink-0">
                          <img src={img} alt={p.name || p.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#8c796e]">{p.category?.name || "چوب طبیعی"}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleProductFeatured(p.id, !!p.featured)}
                              title={p.featured ? "حذف از برگزیده‌ها" : "افزودن به برگزیده‌ها"}
                              className={`p-1 rounded-md transition ${
                                p.featured ? "text-amber-500 fill-amber-500" : "text-stone-300 hover:text-amber-500"
                              }`}
                            >
                              <Star className={`w-4 h-4 ${p.featured ? "fill-current" : ""}`} />
                            </button>
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-[#2b1e17] truncate font-serif">
                            {p.name || p.title}
                          </h4>
                          <div className="text-[11px] text-[#655347] font-serif font-extrabold text-[#b85d19] mt-0.5">
                            {formatPriceToman(p.price)}
                          </div>
                        </div>
                      </div>

                      {/* Stock Controls + Edit */}
                      <div className="pt-3 border-t border-[#e8ded3] flex items-center justify-between text-xs">
                        {/* Quick stock counter */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#655347]">موجودی:</span>
                          <div className="flex items-center gap-1 bg-white border border-[#e8ded3] rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleQuickStockChange(p.id, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 text-[#2b1e17] font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-xs text-[#2b1e17]">
                              {toPersianDigits(p.stock)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickStockChange(p.id, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 text-[#2b1e17] font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProduct(p);
                              setEditPrice(String(p.price));
                              setEditStock(String(p.stock));
                            }}
                            className="h-7.5 px-2.5 text-xs gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>ویرایش</span>
                          </Button>

                          <Link href={`/products/${p.slug}`} target="_blank">
                            <Button size="sm" variant="ghost" className="h-7.5 w-7.5 p-0">
                              <ExternalLink className="w-3.5 h-3.5 text-[#8c796e]" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: REVIEWS MODERATION                                                 */}
        {/* ========================================================================= */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-3xl border border-[#e8ded3] shadow-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#f0e7dd] pb-4">
              <h2 className="text-xl font-bold text-[#2b1e17] font-serif">
                صف بررسی و تأیید دیدگاه‌های مشتریان
              </h2>
              <p className="text-xs text-[#8c796e] mt-0.5">
                نظرات ثبت‌شده توسط خریداران پس از تأیید در صفحه اختصاصی اثر نمایش داده خواهند شد.
              </p>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-[#8c796e] py-12 text-center">
                دیدگاه جدیدی در صف بازبینی وجود ندارد.
              </p>
            ) : (
              <div className="divide-y divide-[#f0e7dd]">
                {reviews.map((r) => (
                  <div key={r.id} className="py-5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-[#2b1e17] flex items-center gap-2">
                        <span>{r.authorName}</span>
                        <div className="flex text-amber-500">
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[#8c796e]">{formatJalaliDate(r.createdAt)}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#2b1e17] bg-[#faf8f5] p-3.5 rounded-2xl border border-[#e8ded3] leading-relaxed">
                      {r.comment}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#8c796e]">
                        وضعیت فعلی: {r.approved ? "منتشر شده" : "در انتظار بررسی"}
                      </span>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewApproval(r.id, false)}
                          className="h-8 text-xs text-red-700 hover:bg-red-50 hover:border-red-200"
                        >
                          <X className="w-3.5 h-3.5" />
                          رد دیدگاه
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReviewApproval(r.id, true)}
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          تأیید و انتشار
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: CONTACTS & BESPOKE INQUIRIES                                       */}
        {/* ========================================================================= */}
        {activeTab === "contacts" && (
          <div className="bg-white rounded-3xl border border-[#e8ded3] shadow-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-[#f0e7dd] pb-4">
              <h2 className="text-xl font-bold text-[#2b1e17] font-serif">
                پیام‌ها و درخواست‌های ساخت سفارشی
              </h2>
              <p className="text-xs text-[#8c796e] mt-0.5">
                استعلام قیمت و ابعاد خاص ثبت‌شده توسط معماران و مشتریان
              </p>
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-[#8c796e] py-12 text-center">پیام جدیدی در صندوق وجود ندارد.</p>
            ) : (
              <div className="space-y-4">
                {contacts.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-5 rounded-2xl border border-[#e8ded3] bg-[#faf8f5]/60 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <strong className="text-sm font-bold text-[#2b1e17]">{msg.name}</strong>
                        <span className="text-[#8c796e] mr-2">
                          ({msg.phone || "بدون تلفن"} • {msg.email})
                        </span>
                      </div>
                      <span className="text-[#8c796e]">{formatJalaliDate(msg.createdAt)}</span>
                    </div>

                    <div className="text-xs font-bold text-[#b85d19]">
                      موضوع درخواست: {msg.subject}
                    </div>

                    <p className="text-xs sm:text-sm text-[#2b1e17] whitespace-pre-line leading-relaxed bg-white p-3.5 rounded-xl border border-[#e8ded3]">
                      {msg.message}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#e8ded3] text-xs">
                      <span className="text-[#8c796e]">
                        وضعیت: {msg.status === "REPLIED" ? "پاسخ داده شد" : msg.status === "READ" ? "خوانده شده" : "جدید"}
                      </span>

                      <div className="flex gap-2">
                        {msg.phone && (
                          <a
                            href={`tel:${msg.phone}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#e8ded3] text-[#2b1e17] hover:border-[#b85d19] transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#b85d19]" />
                            <span>تماس</span>
                          </a>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactStatus(msg.id, "READ")}
                          className="h-8 text-xs"
                        >
                          علامت خوانده شده
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleContactStatus(msg.id, "REPLIED")}
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                        >
                          پاسخ داده شد
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW PRODUCT                                                  */}
      {/* ========================================================================= */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 bg-[#2b1e17]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border border-[#e8ded3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f0e7dd] pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#b85d19]" />
                <h3 className="text-lg font-bold text-[#2b1e17] font-serif">
                  افزودن دست‌سازه جدید به کارگاه روت‌وود
                </h3>
              </div>
              <button
                onClick={() => setShowAddProduct(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#655347] block mb-1">نام اثر *</label>
                  <input
                    type="text"
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    required
                    placeholder="مثال: میز اسلب گردو سیاه"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#655347] block mb-1">دسته‌بندی اثر *</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#655347] block mb-1">قیمت (تومان) *</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                    placeholder="25000000"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#655347] block mb-1">موجودی اولیه کارگاه *</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#655347] block mb-1">گونه چوب</label>
                  <input
                    type="text"
                    value={prodWood}
                    onChange={(e) => setProdWood(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#655347] block mb-1">ابعاد و اندازه‌ها</label>
                  <input
                    type="text"
                    value={prodDimensions}
                    onChange={(e) => setProdDimensions(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#655347] block mb-1">نشانی تصویر (URL)</label>
                  <input
                    type="text"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#655347] block mb-1">شناسنامه و توضیحات اثر</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="مشخصات الوار، پرداخت روغن ارگانیک، نحوه اتصال..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/30"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0e7dd]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddProduct(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={submittingProd}
                  className="bg-[#b85d19] hover:bg-[#9e4e13] font-bold"
                >
                  {submittingProd ? "در حال ثبت اثر..." : "ثبت و انتشار اثر"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT PRODUCT PRICE & STOCK                                       */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-[#2b1e17]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#e8ded3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f0e7dd] pb-3">
              <h3 className="font-bold text-[#2b1e17] font-serif text-base">
                ویرایش سریع اثر: {editingProduct.name || editingProduct.title}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#655347] block mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#655347] block mb-1">موجودی انبار</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  required
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f0e7dd]">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingProduct(null)}>
                  انصراف
                </Button>
                <Button type="submit" size="sm" disabled={savingEdit} className="bg-[#b85d19] hover:bg-[#9e4e13]">
                  {savingEdit ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ORDER FULL DETAIL SHEET / MODAL                                  */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-[#2b1e17]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-[#e8ded3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f0e7dd] pb-4">
              <div>
                <span className="text-xs text-[#8c796e]">جزئیات کامل سفارش:</span>
                <h3 className="text-lg font-bold font-mono text-[#2b1e17]">
                  {selectedOrder.orderNumber || selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#faf8f5] p-4 rounded-2xl border border-[#e8ded3]">
              <div className="space-y-1.5">
                <span className="text-[#8c796e] block font-semibold">مشخصات تحویل‌گیرنده:</span>
                <div className="font-bold text-[#2b1e17] text-sm">{selectedOrder.recipientName}</div>
                <div className="font-mono text-[#655347]">{selectedOrder.phone || selectedOrder.user?.phone || "—"}</div>
                <div className="text-[#8c796e]">{selectedOrder.email || selectedOrder.user?.email}</div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[#8c796e] block font-semibold">نشانی باربری و ارسال:</span>
                <div className="text-[#2b1e17] leading-relaxed">
                  {selectedOrder.city}، {selectedOrder.street}
                </div>
                {selectedOrder.postalCode && (
                  <div className="text-[#8c796e]">کد پستی: <span className="font-mono">{selectedOrder.postalCode}</span></div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#655347] uppercase tracking-wider">اقلام سفارش</h4>
              <div className="divide-y divide-[#f0e7dd] border border-[#e8ded3] rounded-2xl p-4 bg-white">
                {selectedOrder.items?.map((it) => (
                  <div key={it.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-[#2b1e17]">{it.productTitle}</span>
                      <span className="text-[#8c796e] mr-2">× {toPersianDigits(it.quantity)}</span>
                    </div>
                    <span className="font-serif font-bold text-[#b85d19]">
                      {formatPriceToman(it.unitPrice * it.quantity)}
                    </span>
                  </div>
                ))}

                <div className="pt-3 mt-2 flex justify-between items-baseline font-serif">
                  <span className="text-xs font-bold text-[#655347]">مبلغ نهایی:</span>
                  <span className="text-lg font-black text-[#b85d19]">
                    {formatPriceToman(selectedOrder.totalAmount || selectedOrder.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Changer in Modal */}
            <div className="p-4 rounded-2xl bg-[#fdf1e7] border border-[#edd1bc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#b85d19]">تغییر وضعیت ساخت و ارسال:</span>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-[#edd1bc] bg-white font-bold text-[#2b1e17]"
              >
                <option value="PENDING">در انتظار پرداخت</option>
                <option value="PAID">پرداخت شده (نوبت کارگاه)</option>
                <option value="PROCESSING">در حال ساخت و نجاری</option>
                <option value="SHIPPED">ارسال‌شده با باربری</option>
                <option value="DELIVERED">تحویل‌شده به مشتری</option>
                <option value="CANCELLED">لغو شده</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#f0e7dd]">
              <Link
                href={`/track?code=${selectedOrder.orderNumber || selectedOrder.id}`}
                target="_blank"
                className="text-xs text-[#b85d19] font-bold hover:underline flex items-center gap-1"
              >
                <span>مشاهده صفحه رهگیری زنده خریدار</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
