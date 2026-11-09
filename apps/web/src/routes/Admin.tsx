import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  api,
  type AdminSummary,
  type Order,
  type Review,
  type ContactMessage,
  type Category,
} from "@/lib/api";
import { formatPriceToman, toPersianDigits, formatJalaliDate } from "@/lib/price";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";

export function Admin() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "reviews" | "contacts" | "products">("dashboard");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // New product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [prodTitle, setProdTitle] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("5");
  const [prodWood, setProdWood] = useState("چوب گردو سیاه");
  const [prodDimensions, setProdDimensions] = useState("۲۰۰ × ۹۰ × ۷۵ سانتی‌متر");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("/images/placeholder.jpg");
  const [submittingProd, setSubmittingProd] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sumRes, ordRes, revRes, msgRes, catRes] = await Promise.all([
        api.getAdminSummary().catch(() => null),
        api.getAdminOrders().catch(() => ({ orders: [] })),
        api.getAdminReviews().catch(() => ({ reviews: [] })),
        api.getAdminContacts().catch(() => ({ messages: [] })),
        api.getCategories().catch(() => ({ categories: [] })),
      ]);

      if (sumRes) setSummary(sumRes);
      if (ordRes) setOrders(ordRes.orders || []);
      if (revRes) setReviews(revRes.reviews || []);
      if (msgRes) setContacts(msgRes.messages || []);
      if (catRes) {
        setCategories(catRes.categories || []);
        if (catRes.categories.length > 0) {
          setProdCategoryId(catRes.categories[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast("وضعیت سفارش با موفقیت به‌روز شد", "success");
      const res = await api.getAdminOrders();
      setOrders(res.orders || []);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در تغییر وضعیت سفارش", "error");
    }
  };

  const handleReviewApproval = async (reviewId: string, approved: boolean) => {
    try {
      await api.updateReviewApproval(reviewId, approved);
      showToast(approved ? "دیدگاه تأیید و منتشر شد" : "دیدگاه رد و حذف شد", "success");
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
        slug: generatedSlug,
        categoryId: prodCategoryId,
        price: parseInt(prodPrice, 10),
        stock: parseInt(prodStock, 10) || 1,
        woodType: prodWood.trim(),
        dimensions: prodDimensions.trim(),
        shortDescription: prodDescription.trim().slice(0, 150),
        description: prodDescription.trim(),
        imageUrl: prodImageUrl.trim() || "/images/placeholder.jpg",
      });
      showToast("دست‌سازه جدید با موفقیت ثبت شد", "success");
      setShowAddProduct(false);
      setProdTitle("");
      setProdSlug("");
      setProdPrice("");
      setProdDescription("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت محصول", "error");
    } finally {
      setSubmittingProd(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-stone-900 font-serif">دسترسی مدیریت محدود است</h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          این بخش تنها مختص مدیران آتلیه روت‌وود می‌باشد. برای ورود به این بخش با شناسه مدیر لاگین فرمایید.
        </p>
        <Link
          href="/"
          className="inline-block bg-amber-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-800 transition"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-stone-50/50 min-h-[85vh] pb-20">
      {/* Top Header */}
      <div className="bg-stone-900 text-stone-100 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900 flex items-center justify-center text-amber-200 font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-serif">میز مدیریت آتلیه چوب روت‌وود</h1>
              <p className="text-xs text-stone-400">پنل کنترل سفارش‌ها، نظرات و کاتالوگ آثار</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              افزودن اثر جدید به کاتالوگ
            </button>
            <Link
              href="/"
              className="text-stone-300 hover:text-white text-xs px-3 py-2 rounded-xl border border-stone-700 transition"
            >
              مشاهده سایت
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto text-xs sm:text-sm font-medium mb-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-xl transition shrink-0 ${
              activeTab === "dashboard"
                ? "bg-amber-900 text-white font-semibold"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            داشبورد کلی
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl transition shrink-0 ${
              activeTab === "orders"
                ? "bg-amber-900 text-white font-semibold"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            سفارش‌ها ({toPersianDigits(orders.length)})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 rounded-xl transition shrink-0 flex items-center gap-1.5 ${
              activeTab === "reviews"
                ? "bg-amber-900 text-white font-semibold"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            تأیید دیدگاه‌ها
            {reviews.length > 0 && (
              <span className="bg-amber-500 text-stone-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {toPersianDigits(reviews.length)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2 rounded-xl transition shrink-0 ${
              activeTab === "contacts"
                ? "bg-amber-900 text-white font-semibold"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            پیام‌ها و سفارشی‌سازی ({toPersianDigits(contacts.length)})
          </button>
        </div>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 font-medium">کل درآمد موفق</p>
                  <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
                    {formatPriceToman(summary?.totalRevenue || 0)}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 font-medium">سفارش‌های پرداخت شده</p>
                  <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
                    {toPersianDigits(summary?.paidOrders || 0)} سفارش
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 font-medium">تعداد کل مشتریان</p>
                  <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
                    {toPersianDigits(summary?.customers || 0)} نفر
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-500 font-medium">در انتظار بررسی / کارگاه</p>
                  <h2 className="text-xl font-bold font-serif text-stone-900 mt-1">
                    {toPersianDigits(summary?.ordersByStatus?.PENDING || 0)} سفارش
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Low stock alerts */}
            {summary?.lowStock && summary.lowStock.length > 0 && (
              <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>هشدار موجودی کارگاه (کمتر از ۳ عدد)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {summary.lowStock.map((ls) => (
                    <div key={ls.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs">
                      <div className="font-bold text-stone-900">{ls.title}</div>
                      <div className="text-amber-800 mt-1 font-semibold">
                        موجودی باقی‌مانده: {toPersianDigits(ls.stock)} عدد
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Orders Management */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-6">
            <h2 className="text-lg font-bold text-stone-900 font-serif">مدیریت و گردش کار سفارش‌ها</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600">
                    <th className="p-3">کد سفارش</th>
                    <th className="p-3">خریدار</th>
                    <th className="p-3">تاریخ</th>
                    <th className="p-3">مبلغ کل</th>
                    <th className="p-3">وضعیت فعلی</th>
                    <th className="p-3">تغییر وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50/50">
                      <td className="p-3 font-mono font-bold text-stone-900">{o.id.slice(0, 10)}</td>
                      <td className="p-3">
                        <div className="font-semibold text-stone-800">{o.recipientName}</div>
                        <div className="text-stone-400 text-xs">{o.phone}</div>
                      </td>
                      <td className="p-3 text-stone-500">{formatJalaliDate(o.createdAt)}</td>
                      <td className="p-3 font-bold text-[#8c4f27] font-serif">
                        {formatPriceToman(o.totalAmount)}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-800">
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white focus:outline-none focus:border-amber-900"
                        >
                          <option value="PENDING">PENDING (در انتظار)</option>
                          <option value="PAID">PAID (پرداخت شده)</option>
                          <option value="PROCESSING">PROCESSING (ساخت)</option>
                          <option value="SHIPPED">SHIPPED (ارسال شده)</option>
                          <option value="DELIVERED">DELIVERED (تحویل شده)</option>
                          <option value="CANCELLED">CANCELLED (لغو شده)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Reviews Moderation */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-900 font-serif">صف بازبینی و تأیید دیدگاه‌ها</h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                دیدگاه بررسی‌نشده‌ای در صف وجود ندارد.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {reviews.map((r) => (
                  <div key={r.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>{r.authorName}</span>
                        <div className="flex text-amber-500">
                          {[...Array(r.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <span className="text-stone-400">{formatJalaliDate(r.createdAt)}</span>
                    </div>

                    <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      {r.comment}
                    </p>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleReviewApproval(r.id, false)}
                        className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        رد دیدگاه
                      </button>
                      <button
                        onClick={() => handleReviewApproval(r.id, true)}
                        className="text-xs text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        تأیید و انتشار
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Contact Messages */}
        {activeTab === "contacts" && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-900 font-serif">پیام‌های تماس و سفارشات اختصاصی</h2>
            {contacts.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">پیام جدیدی وجود ندارد.</p>
            ) : (
              <div className="space-y-4">
                {contacts.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900">{msg.name}</span>
                        <span className="text-stone-500 mr-2">({msg.email} | {msg.phone || "بدون تلفن"})</span>
                      </div>
                      <span className="text-stone-400">{formatJalaliDate(msg.createdAt)}</span>
                    </div>

                    <div className="text-xs font-semibold text-amber-900">موضوع: {msg.subject}</div>
                    <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                      {msg.message}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                      <span className="text-stone-500">وضعیت: {msg.status}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleContactStatus(msg.id, "READ")}
                          className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                        >
                          خوانده شد
                        </button>
                        <button
                          onClick={() => handleContactStatus(msg.id, "REPLIED")}
                          className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                        >
                          پاسخ داده شد
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Product */}
        {showAddProduct && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-lg font-bold text-stone-900 font-serif">افزودن دست‌سازه جدید به کاتالوگ</h3>
                <button onClick={() => setShowAddProduct(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">نام دست‌سازه *</label>
                    <input
                      type="text"
                      value={prodTitle}
                      onChange={(e) => setProdTitle(e.target.value)}
                      required
                      placeholder="مثال: میز کار منبت گردو"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">دسته‌بندی اثر *</label>
                    <select
                      value={prodCategoryId}
                      onChange={(e) => setProdCategoryId(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900 bg-white"
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
                    <label className="text-xs font-semibold text-stone-700 block mb-1">قیمت (تومان) *</label>
                    <input
                      type="number"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      required
                      placeholder="35000000"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">موجودی اولیه *</label>
                    <input
                      type="number"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      required
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">گونه چوب</label>
                    <input
                      type="text"
                      value={prodWood}
                      onChange={(e) => setProdWood(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">ابعاد و اندازه‌ها</label>
                  <input
                    type="text"
                    value={prodDimensions}
                    onChange={(e) => setProdDimensions(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">نشانی تصویر (URL)</label>
                  <input
                    type="text"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="https://... یا /images/..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">توضیحات و شناسنامه اثر</label>
                  <textarea
                    rows={3}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddProduct(false)}
                    className="text-xs text-stone-600 px-4 py-2 rounded-xl hover:bg-stone-100"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProd}
                    className="bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
                  >
                    {submittingProd ? "در حال ثبت..." : "ثبت و انتشار اثر"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
