import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Clock,
  KeyRound,
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

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "در انتظار پرداخت", color: "bg-amber-100 text-amber-800 border-amber-200" },
  PAID: { label: "پرداخت شده (نوبت کارگاه)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PROCESSING: { label: "در حال ساخت و فینیش", color: "bg-blue-100 text-blue-800 border-blue-200" },
  SHIPPED: { label: "تحویل به باربری و ارسال", color: "bg-purple-100 text-purple-800 border-purple-200" },
  DELIVERED: { label: "تحویل مشتری شد", color: "bg-stone-100 text-stone-800 border-stone-200" },
  CANCELLED: { label: "لغو شده", color: "bg-red-100 text-red-800 border-red-200" },
};

export function Account() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { showToast } = useToast();
  const { openAuthDialog } = useStoreDialogs();

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "security">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newProvince, setNewProvince] = useState("تهران");
  const [newCity, setNewCity] = useState("تهران");
  const [newStreet, setNewStreet] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthDialog();
    }
  }, [authLoading, isAuthenticated]);

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
    if (!newRecipient.trim() || !newPhone.trim() || !newStreet.trim()) {
      showToast("لطفاً فیلدهای الزامی آدرس را پر کنید", "error");
      return;
    }

    try {
      await api.createAddress({
        recipientName: newRecipient.trim(),
        phone: newPhone.trim(),
        province: newProvince.trim(),
        city: newCity.trim(),
        street: newStreet.trim(),
        postalCode: newPostalCode.trim() || undefined,
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast("رمز عبور جدید باید حداقل ۶ کاراکتر باشد", "error");
      return;
    }
    setChangingPass(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      showToast(res.message || "رمز عبور با موفقیت به‌روزرسانی شد", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در تغییر رمز عبور", "error");
    } finally {
      setChangingPass(false);
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
        <div className="w-10 h-10 border-4 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-stone-900 font-serif">ورود به حساب کاربری</h1>
        <p className="text-stone-600 text-sm">برای مشاهده سوابق خرید و تنظیمات، لطفاً وارد شوید.</p>
        <button
          onClick={() => openAuthDialog()}
          className="bg-amber-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-800 transition"
        >
          ورود با پیامک یا رمز عبور
        </button>
      </div>
    );
  }

  return (
    <div className="bg-stone-50/50 min-h-[80vh] pb-20">
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-stone-500">
            <Link href="/" className="hover:text-amber-900 transition">خانه</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">حساب کاربری</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* User Sidebar - 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-900 text-amber-50 font-bold text-xl flex items-center justify-center font-serif shadow-sm">
                  {user.name.charAt(0) || "ک"}
                </div>
                <div>
                  <h1 className="font-bold text-stone-900 text-base">{user.name}</h1>
                  <p className="text-xs text-stone-500 mt-0.5">{user.phone || user.email}</p>
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
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  ورود به پنل مدیریت آتلیه
                </Link>
              )}

              {/* Navigation pills */}
              <div className="space-y-1 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                    activeTab === "orders"
                      ? "bg-amber-900 text-white font-semibold"
                      : "text-stone-700 hover:bg-stone-50"
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
                      ? "bg-amber-900 text-white font-semibold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  دفترچه آدرس‌ها ({toPersianDigits(addresses.length)})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                    activeTab === "security"
                      ? "bg-amber-900 text-white font-semibold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  امنیت و رمز عبور
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
                      const st = statusMap[order.status] || {
                        label: order.status,
                        color: "bg-stone-100 text-stone-700",
                      };
                      return (
                        <div
                          key={order.id}
                          className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                            <div className="space-y-0.5">
                              <span className="text-xs text-stone-500">
                                شناسه: <strong className="font-mono text-stone-900">{order.id.slice(0, 10)}</strong>
                              </span>
                              <div className="text-xs text-stone-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatJalaliDate(order.createdAt)}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full border ${st.color}`}
                              >
                                {st.label}
                              </span>
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

                          {/* Order actions */}
                          {order.status === "PENDING" && (
                            <div className="pt-2 flex justify-end gap-2">
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-xs text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                              >
                                لغو سفارش
                              </button>
                            </div>
                          )}
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
                  <h2 className="text-xl font-bold text-stone-900 font-serif">نشانی‌های ثبت‌شده شما</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="bg-amber-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-amber-800 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن نشانی جدید
                  </button>
                </div>

                {/* Add address form */}
                {showAddAddress && (
                  <form
                    onSubmit={handleCreateAddress}
                    className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4"
                  >
                    <h3 className="text-sm font-bold text-stone-900">ثبت نشانی تحویل جدید</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">نام تحویل‌گیرنده *</label>
                        <input
                          type="text"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          required
                          placeholder="مثال: آرش سلیمی"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">شماره تماس *</label>
                        <input
                          type="tel"
                          dir="ltr"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          required
                          placeholder="09123456789"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">استان *</label>
                        <input
                          type="text"
                          value={newProvince}
                          onChange={(e) => setNewProvince(e.target.value)}
                          required
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">شهر *</label>
                        <input
                          type="text"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          required
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">کد پستی</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={newPostalCode}
                          onChange={(e) => setNewPostalCode(e.target.value)}
                          placeholder="1234567890"
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 text-right"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">نشانی دقیق پستی *</label>
                      <textarea
                        rows={2}
                        value={newStreet}
                        onChange={(e) => setNewStreet(e.target.value)}
                        required
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="text-xs text-stone-600 px-4 py-2 rounded-lg hover:bg-stone-100"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-900 text-white text-xs font-semibold px-5 py-2 rounded-lg hover:bg-amber-800"
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
                          <div className="text-xs text-stone-500">{addr.phone}</div>
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

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
                <div className="border-b border-stone-100 pb-3">
                  <h2 className="text-lg font-bold text-stone-900 font-serif">تغییر رمز عبور</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    برای امنیت حساب خود، از رمز عبور با ترکیبی از حروف و اعداد استفاده فرمایید.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      رمز عبور فعلی (در صورت داشتن رمز قبلی)
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      رمز عبور جدید * (حداقل ۶ کاراکتر)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPass}
                    className="bg-amber-900 text-white text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-amber-800 transition disabled:opacity-50"
                  >
                    {changingPass ? "در حال به‌روزرسانی..." : "به‌روزرسانی رمز عبور"}
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
