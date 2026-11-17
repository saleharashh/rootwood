import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  Clock,
  LogOut,
  MapPin,
  Package,
  Plus,
  Shield,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { api, type Order, type Address } from "@/lib/api";
import { formatPriceToman, toPersianDigits, formatJalaliDate } from "@/lib/price";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import { StatusBadge } from "@/components/status-badge";
import {
  isPlaceholderUserName,
  isSyntheticEmail,
  normalizeIranianPhone,
  normalizePostalCode,
} from "@/lib/validation";

export function Account() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isProfileComplete, loading: authLoading, logout, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { openAuth } = useStoreDialogs();

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");

  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuth();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setProfileName(isPlaceholderUserName(user.name) ? "" : user.name);
      setProfileEmail(isSyntheticEmail(user.email) ? "" : user.email);
      if (!newRecipient && !isPlaceholderUserName(user.name)) {
        setNewRecipient(user.name);
      }
      if (!newPhone && user.phone) {
        setNewPhone(user.phone);
      }
      if (!isPlaceholderUserName(user.name)) {
        // Keep current tab unless initial incomplete prompt
      } else {
        setActiveTab("profile");
      }
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      loadAddresses();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getOrders();
      setOrders(res.orders || []);
    } catch {
      // non-fatal
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.getAddresses();
      setAddresses(res.addresses || []);
    } catch {
      // non-fatal
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRecipient = newRecipient.trim();
    const validPhone = normalizeIranianPhone(newPhone);
    const cleanProvince = newProvince.trim();
    const cleanCity = newCity.trim();
    const cleanStreet = newStreet.trim();
    const validPostal = normalizePostalCode(newPostalCode);

    if (cleanRecipient.length < 2 || isPlaceholderUserName(cleanRecipient)) {
      showToast("لطفاً نام و نام خانوادگی تحویل‌گیرنده را دقیق وارد نمایید", "error");
      return;
    }
    if (!validPhone) {
      showToast("لطفاً شماره موبایل معتبر تحویل‌گیرنده (مانند 09123456789) وارد نمایید", "error");
      return;
    }
    if (cleanProvince.length < 2 || cleanCity.length < 2) {
      showToast("لطفاً نام استان و شهر را دقیق وارد نمایید", "error");
      return;
    }
    if (!validPostal) {
      showToast("کد پستی باید دقیقاً ۱۰ رقم بدون خط تیره باشد", "error");
      return;
    }
    if (cleanStreet.length < 10) {
      showToast("لطفاً نشانی دقیق پستی (خیابان، کوچه، پلاک و واحد) را حداقل در ۱۰ کاراکتر وارد نمایید", "error");
      return;
    }

    try {
      await api.createAddress({
        recipientName: cleanRecipient,
        fullName: cleanRecipient,
        phone: validPhone,
        province: cleanProvince,
        state: cleanProvince,
        city: cleanCity,
        street: cleanStreet,
        line1: cleanStreet,
        postalCode: validPostal,
        isDefault: addresses.length === 0,
      });
      showToast("آدرس جدید با موفقیت ثبت شد", "success");
      setShowAddAddress(false);
      setNewStreet("");
      setNewPostalCode("");
      loadAddresses();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت آدرس", "error");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("آیا از حذف این آدرس اطمینان دارید؟")) return;
    try {
      await api.deleteAddress(id);
      showToast("آدرس حذف شد", "success");
      loadAddresses();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در حذف آدرس", "error");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = profileName.trim();
    const cleanEmail = profileEmail.trim();

    if (cleanName.length < 2 || isPlaceholderUserName(cleanName)) {
      showToast("لطفاً نام و نام خانوادگی واقعی خود را وارد نمایید", "error");
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showToast("فرمت ایمیل واردشده معتبر نیست", "error");
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile(cleanName, cleanEmail);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت اطلاعات کاربری", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("آیا از لغو این سفارش اطمینان دارید؟")) return;
    try {
      await api.cancelOrder(orderId);
      showToast("سفارش لغو شد و موجودی به کارگاه بازگشت", "success");
      loadOrders();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در لغو سفارش", "error");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#b85d19]/20 border-t-[#b85d19] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-[#2b1e17] font-serif">ورود به حساب کاربری</h1>
        <p className="text-[#655347] text-sm">برای مشاهده سوابق خرید و ثبت اطلاعات، لطفاً با شماره موبایل خود وارد شوید.</p>
        <button
          onClick={openAuth}
          className="bg-[#b85d19] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#9e4e13] transition shadow-sm"
        >
          ورود با شماره موبایل
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f5] min-h-[80vh] pb-20">
      <div className="border-b border-[#e8ded3] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#8c796e]">
            <Link href="/" className="hover:text-[#b85d19] transition">خانه</Link>
            <span>/</span>
            <span className="text-[#2b1e17] font-medium">حساب کاربری</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {(!isProfileComplete || addresses.length === 0) && (
          <div className="bg-[#fdf1e7] border border-[#edd1bc] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#54311c]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#b85d19] shrink-0" />
              <span>
                {!isProfileComplete
                  ? "برای ثبت سفارش و ارسال آثار، لطفاً نام و نام خانوادگی خود را در بخش مشخصات کاربری تکمیل نمایید."
                  : "هنوز نشانی تحویلی ثبت نکرده‌اید؛ می‌توانید همین حالا آدرس دقیق خود را برای خریدهای سریع‌تر ثبت کنید."}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isProfileComplete) {
                  setActiveTab("profile");
                } else {
                  setActiveTab("addresses");
                  setShowAddAddress(true);
                }
              }}
              className="bg-[#b85d19] hover:bg-[#9e4e13] text-white text-xs font-bold px-4 py-2 rounded-xl transition shrink-0 self-start sm:self-auto"
            >
              {!isProfileComplete ? "تکمیل مشخصات کاربری" : "ثبت نشانی تحویل"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* User Sidebar - 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-[#e8ded3] shadow-card space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2b1e17] text-white font-bold text-xl flex items-center justify-center font-serif shadow-sm">
                  {user.name.charAt(0) || "ک"}
                </div>
                <div>
                  <h1 className="font-bold text-[#2b1e17] text-base">{user.name}</h1>
                  <p className="text-xs text-[#8c796e] mt-0.5 font-mono" dir="ltr">
                    {user.phone || (!isSyntheticEmail(user.email) ? user.email : "")}
                  </p>
                  {user.role === "ADMIN" && (
                    <span className="inline-block mt-1 text-[11px] font-bold bg-[#b85d19] text-white px-2 py-0.5 rounded">
                      مدیر کارگاه
                    </span>
                  )}
                </div>
              </div>

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="w-full bg-[#2b1e17] hover:bg-[#3d2c22] text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Shield className="w-4 h-4 text-[#f0a868]" />
                  ورود به پنل مدیریت آتلیه
                </Link>
              )}

              {/* Navigation pills */}
              <div className="space-y-1 pt-3 border-t border-[#f0e7dd]">
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                    activeTab === "orders"
                      ? "bg-[#b85d19] text-white font-semibold shadow-xs"
                      : "text-[#655347] hover:bg-[#f4ece4]"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  سفارش‌های من ({toPersianDigits(orders.length)})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("addresses")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                    activeTab === "addresses"
                      ? "bg-[#b85d19] text-white font-semibold shadow-xs"
                      : "text-[#655347] hover:bg-[#f4ece4]"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  دفترچه آدرس‌ها ({toPersianDigits(addresses.length)})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                    activeTab === "profile"
                      ? "bg-[#b85d19] text-white font-semibold shadow-xs"
                      : "text-[#655347] hover:bg-[#f4ece4]"
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  مشخصات کاربری
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setLocation("/");
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-red-700 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  خروج از حساب کاربری
                </button>
              </div>
            </div>
          </div>

          {/* Main content - 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-stone-900 font-serif">تاریخچه سفارش‌های شما</h2>
                  <span className="text-xs text-stone-500">
                    مجموع {toPersianDigits(orders.length)} سفارش ثبت‌شده
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-3">
                    <Package className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-stone-600 text-sm">شما تاکنون سفارشی ثبت نکرده‌اید.</p>
                    <Link
                      href="/products"
                      className="inline-block text-xs font-semibold text-amber-900 hover:underline"
                    >
                      مرور آثار و ثبت اولین سفارش ←
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      return (
                        <div
                          key={order.id}
                          className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                            <div className="space-y-0.5">
                              <span className="text-xs text-stone-500">
                                شناسه: <strong className="font-mono text-stone-900">{order.orderNumber || order.id.slice(0, 10)}</strong>
                              </span>
                              <div className="text-xs text-stone-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatJalaliDate(order.createdAt)}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <StatusBadge status={order.status} />
                            </div>
                          </div>

                          {/* Items list */}
                          <div className="space-y-2">
                            {order.items?.map((it) => (
                              <div key={it.id} className="flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-800" />
                                  <span className="font-medium text-stone-800">{it.productTitle}</span>
                                  <span className="text-stone-400">× {toPersianDigits(it.quantity)}</span>
                                </div>
                                <span className="font-semibold text-stone-900">
                                  {formatPriceToman(it.unitPrice * it.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Delivery info & Total */}
                          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                            <div className="text-stone-500 text-xs">
                              ارسال به: {order.recipientName} ({order.city}، {order.street.slice(0, 30)}...)
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-stone-600">مبلغ پرداخت:</span>
                              <span className="font-extrabold text-[#b85d19] font-serif text-base">
                                {formatPriceToman(order.totalAmount)}
                              </span>
                            </div>
                          </div>

                          {/* Order actions & tracking */}
                          <div className="pt-2 flex items-center justify-between gap-2">
                            <Link
                              href={`/track?code=${order.orderNumber || order.id}`}
                              className="text-xs font-semibold text-[#b85d19] hover:text-[#9e4e13] flex items-center gap-1.5 hover:underline"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>پیگیری زنده مراحل ساخت و ارسال ←</span>
                            </Link>

                            {order.status === "PENDING" && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-xs text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                              >
                                لغو سفارش
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#2b1e17] font-serif">نشانی‌های ثبت‌شده شما</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="bg-[#b85d19] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#9e4e13] transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن نشانی جدید
                  </button>
                </div>

                {/* Add address form */}
                {showAddAddress && (
                  <form
                    onSubmit={handleCreateAddress}
                    className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e8ded3] shadow-card space-y-4"
                  >
                    <h3 className="text-sm font-bold text-[#2b1e17]">ثبت نشانی تحویل جدید</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[#655347] block mb-1">نام و نام خانوادگی تحویل‌گیرنده *</label>
                        <input
                          type="text"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          required
                          placeholder="مثال: آرش سلیمی"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#655347] block mb-1">شماره موبایل تماس *</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          dir="ltr"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          required
                          placeholder="09123456789"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19] text-left font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[#655347] block mb-1">استان *</label>
                        <input
                          type="text"
                          value={newProvince}
                          onChange={(e) => setNewProvince(e.target.value)}
                          required
                          placeholder="مثال: یزد"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#655347] block mb-1">شهر *</label>
                        <input
                          type="text"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          required
                          placeholder="مثال: یزد"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[#655347] block mb-1">کد پستی ۱۰ رقمی *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          maxLength={10}
                          value={newPostalCode}
                          onChange={(e) => setNewPostalCode(e.target.value)}
                          required
                          placeholder="1234567890"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19] text-left font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#655347] block mb-1">نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *</label>
                      <textarea
                        rows={2}
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        required
                        placeholder="خیابان، کوچه، پلاک، طبقه و واحد..."
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="text-xs text-[#655347] px-4 py-2 rounded-lg hover:bg-[#f4ece4]"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="bg-[#b85d19] text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-[#9e4e13] shadow-xs"
                      >
                        ذخیره نشانی
                      </button>
                    </div>
                  </form>
                )}

                {loadingAddresses ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center space-y-3">
                    <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-stone-600 text-sm">هیچ نشانی در دفترچه آدرس شما ثبت نشده است.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 relative flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 text-sm">{addr.recipientName}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                                نشانی پیش‌فرض
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 font-mono" dir="ltr">{addr.phone}</div>
                          <p className="text-xs text-stone-700 leading-relaxed pt-1">
                            {addr.province}، {addr.city}، {addr.street}
                          </p>
                          {addr.postalCode && (
                            <div className="text-xs text-stone-500 font-mono" dir="ltr">
                              کدپستی: {addr.postalCode}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            حذف نشانی
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab (Replaces Password/Security Tab) */}
            {activeTab === "profile" && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                <div className="border-b border-stone-100 pb-3">
                  <h2 className="text-lg font-bold text-[#2b1e17] font-serif">مشخصات کاربری و تکمیل اطلاعات</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    شماره موبایل شما تایید شده است؛ برای تسریع در ارسال سفارش‌ها نام و مشخصات خود را ثبت یا ویرایش کنید.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-[#655347] block mb-1">
                      شماره موبایل تاییدشده (شناسه ورود)
                    </label>
                    <input
                      type="text"
                      value={user.phone || ""}
                      disabled
                      dir="ltr"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] bg-[#f4ece4]/60 text-[#655347] font-mono text-left cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#655347] block mb-1">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      placeholder="مثال: سهراب سپهری"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#655347] block mb-1">
                      ایمیل (اختیاری)
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="name@example.com"
                      dir="ltr"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#e8ded3] focus:outline-none focus:ring-2 focus:ring-[#b85d19]/20 focus:border-[#b85d19] text-left"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#b85d19] text-white text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-[#9e4e13] transition disabled:opacity-50 shadow-xs"
                  >
                    {savingProfile ? "در حال ذخیره..." : "ذخیره مشخصات کاربری"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
