"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { formatCount, formatDate, formatPrice } from "@/lib/price";
import {
  cancelOrder,
  changePassword,
  createAddress as createAddressRequest,
  deleteAddress as deleteAddressRequest,
  getAddresses,
  getOrders,
  updateAddress,
  updateProfile,
  type Address,
  type Order,
} from "@/lib/api";
import { Spinner } from "@/components/loading";
import {
  Package,
  MapPin,
  User,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Check,
  CircleAlert,
} from "lucide-react";

type View = "overview" | "orders" | "addresses" | "profile";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغو‌شده",
};

export default function AccountPage() {
  const { user, loading: authLoading, signOut, refreshUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmation: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  });
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    isDefault: false,
  });
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/signin?redirect=/account");
      return;
    }
    let cancelled = false;
    Promise.all([getOrders(), getAddresses()])
      .then(([o, a]) => {
        if (cancelled) return;
        setOrders(o);
        setAddresses(a);
        setProfileForm({ name: user.name, phone: user.phone ?? "" });
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "دریافت اطلاعات حساب ممکن نشد");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  async function refreshOrdersAndAddresses() {
    try {
      const [o, a] = await Promise.all([getOrders(), getAddresses()]);
      setOrders(o);
      setAddresses(a);
      setLoadError(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "به‌روزرسانی اطلاعات ممکن نشد";
      setLoadError(message);
      toast(message, "error");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast("از حساب خارج شدید", "info");
      router.push("/");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "خروج ممکن نشد", "error");
    }
  }

  async function handleProfileSave() {
    setSavingProfile(true);
    try {
      await updateProfile(null, profileForm);
      await refreshUser();
      toast("مشخصات به‌روز شد", "success");
      setView("overview");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "به‌روزرسانی مشخصات ممکن نشد", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave() {
    if (passwordForm.newPassword.length < 8) {
      toast("گذرواژه تازه باید حداقل ۸ نویسه باشد", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmation) {
      toast("تکرار گذرواژه یکسان نیست", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(null, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmation: "" });
      toast("گذرواژه تغییر کرد و نشست‌های قبلی باطل شدند", "success");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "تغییر گذرواژه ممکن نشد", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  function resetAddressForm() {
    setEditingAddressId(null);
    setNewAddress({
      fullName: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
      isDefault: false,
    });
  }

  function handleEditAddress(address: Address) {
    setEditingAddressId(address.id);
    setNewAddress({
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postalCode: address.postalCode,
      phone: address.phone ?? "",
      isDefault: address.isDefault,
    });
    setView("profile");
  }

  async function handleAddAddress() {
    if (!newAddress.fullName.trim() || !newAddress.line1.trim() || !newAddress.city.trim()) {
      toast("فیلدهای لازم نشانی را پر کنید", "error");
      return;
    }
    if (!/^\d{10}$/.test(newAddress.postalCode.trim())) {
      toast("کد پستی باید ۱۰ رقم انگلیسی باشد", "error");
      return;
    }
    if (newAddress.phone.trim() && !/^[+\d][\d\s-]{7,19}$/.test(newAddress.phone.trim())) {
      toast("شماره تماس نامعتبر است", "error");
      return;
    }
    setCreatingAddress(true);
    try {
      const dto = {
        ...newAddress,
        fullName: newAddress.fullName.trim(),
        line1: newAddress.line1.trim(),
        line2: newAddress.line2.trim() || undefined,
        city: newAddress.city.trim(),
        state: newAddress.state.trim() || undefined,
        postalCode: newAddress.postalCode.trim(),
        phone: newAddress.phone.trim() || undefined,
      };
      if (editingAddressId) {
        await updateAddress(null, editingAddressId, dto);
      } else {
        await createAddressRequest(null, dto);
      }
      await refreshOrdersAndAddresses();
      const wasEditing = Boolean(editingAddressId);
      resetAddressForm();
      toast(wasEditing ? "نشانی ویرایش شد" : "نشانی اضافه شد", "success");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "ذخیره نشانی ممکن نشد", "error");
    } finally {
      setCreatingAddress(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("این نشانی حذف شود؟")) return;
    try {
      await deleteAddressRequest(null, id);
      if (editingAddressId === id) resetAddressForm();
      await refreshOrdersAndAddresses();
      toast("نشانی حذف شد", "info");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "حذف نشانی ممکن نشد", "error");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await updateAddress(null, id, { isDefault: true });
      await refreshOrdersAndAddresses();
      toast("نشانی پیش‌فرض تغییر کرد", "info");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "تغییر نشانی پیش‌فرض ممکن نشد", "error");
    }
  }

  async function handleCancelOrder(id: string) {
    if (!confirm("این سفارش لغو شود؟")) return;
    setCancellingOrderId(id);
    try {
      await cancelOrder(null, id);
      await refreshOrdersAndAddresses();
      toast("سفارش لغو شد و موجودی کالاها بازگردانده شد", "success");
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : "لغو سفارش ممکن نشد", "error");
    } finally {
      setCancellingOrderId(null);
    }
  }

  const statusColor: Record<string, string> = {
    PENDING: "border border-amber-300 bg-amber-50 text-amber-950 font-bold",
    PAID: "border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold",
    SHIPPED: "border border-sky-300 bg-sky-50 text-sky-950 font-bold",
    DELIVERED: "border border-teal-300 bg-teal-50 text-teal-950 font-bold",
    CANCELLED: "border border-rose-300 bg-rose-50 text-rose-950 font-bold",
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="glass-card rounded-[28px] p-10">
          <div className="glass-pill mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[var(--color-error)]">
            <CircleAlert className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-lg text-[var(--color-error)]">{loadError}</p>
          <button type="button" onClick={() => void refreshOrdersAndAddresses()} className="btn btn-primary mt-4">
            تلاش دوباره
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xs">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-wood)] text-xl font-bold text-white shadow-xs"
            >
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="inline-block rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-accent-strong)]">
                حساب کاربری کارگاه
              </span>
              <h1 className="mt-1 truncate text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
                {user.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                {user.email}
                {user.role === "ADMIN" ? " · مدیر ارشد" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn btn-ghost text-xs hover:border-[var(--color-error)]/40 hover:text-[var(--color-error)]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            خروج از حساب
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div
        className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-xs sm:grid-cols-4"
        role="tablist"
        aria-label="بخش‌های حساب کاربری"
      >
        {(["overview", "orders", "addresses", "profile"] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`cursor-pointer rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
              view === v
                ? "bg-[var(--color-wood)] text-white shadow-xs"
                : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            }`}
          >
            {v === "overview" && "نمای کلی"}
            {v === "orders" && "سفارش‌ها"}
            {v === "addresses" && "نشانی‌ها"}
            {v === "profile" && "مشخصات"}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === "overview" && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="#orders-tab"
            className="glass-card card-lift block rounded-[24px] p-6"
            onClick={() => setView("orders")}
          >
            <div className="flex items-center gap-3">
              <div className="glass-pill flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--color-accent-strong)]">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">سفارش‌ها</p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {formatCount(orders.length)} سفارش
                </p>
              </div>
            </div>
          </Link>
          <Link
            href="#addresses-tab"
            className="glass-card card-lift block rounded-[24px] p-6"
            onClick={() => setView("addresses")}
          >
            <div className="flex items-center gap-3">
              <div className="glass-pill flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--color-accent-strong)]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">نشانی‌ها</p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {formatCount(addresses.length)} ذخیره‌شده
                </p>
              </div>
            </div>
          </Link>
          <Link
            href="#profile-tab"
            className="glass-card card-lift block rounded-[24px] p-6"
            onClick={() => setView("profile")}
          >
            <div className="flex items-center gap-3">
              <div className="glass-pill flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--color-accent-strong)]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-ink)]">مشخصات</p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  نام، تلفن و ترجیح‌ها را به‌روز کنید
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Orders */}
      {view === "orders" && (
        <div id="orders-tab">
          {orders.length === 0 ? (
            <div className="glass-card rounded-[26px] p-10 text-center">
              <div className="glass-pill mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-ink-mute)]">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-wood)]">
                هنوز سفارشی ثبت نشده
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                وقتی سفارشی ثبت کنید، همین‌جا نمایش داده می‌شود.
              </p>
              <Link
                href="/products"
                className="btn btn-wood mt-4 inline-flex"
              >
                شروع خرید
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-wood)] mb-4">
                تاریخچه سفارش‌ها
              </h2>
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-card flex gap-4 rounded-[22px] p-4"
                  >
                    <div className="glass-media flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/50">
                      {order.items[0]?.image ? (
                        <Image
                          src={order.items[0]!.image!}
                          alt={order.items[0]!.name}
                          width={56}
                          height={56}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-[var(--color-ink-mute)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId((current) => current === order.id ? null : order.id)}
                            className="cursor-pointer text-sm font-semibold text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent-strong)]"
                            aria-expanded={expandedOrderId === order.id}
                          >
                            {order.orderNumber}
                          </button>
                          <p className="text-xs font-medium text-[var(--color-ink-soft)]">
                            {formatCount(order.items.length)} قلم
                            {order.items.length > 0 && " · "}
                            {order.items.map((i) => i.name).join("، ")}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusColor[order.status] ?? "border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink-soft)] font-medium"}`}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-ink-soft)]">
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="font-medium text-[var(--color-wood)]">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      {expandedOrderId === order.id && (
                        <div className="glass-inset mt-4 rounded-2xl p-4">
                          <ul className="space-y-2 text-sm">
                            {order.items.map((item) => (
                              <li key={item.id} className="flex justify-between gap-3">
                                <span className="text-[var(--color-ink-soft)]">
                                  {item.name} · {formatCount(item.quantity)} عدد
                                </span>
                                <span className="shrink-0 text-[var(--color-ink)]">{formatPrice(item.lineTotal)}</span>
                              </li>
                            ))}
                          </ul>
                          {order.shippingAddress && (
                            <address className="mt-4 text-xs not-italic leading-6 text-[var(--color-ink-soft)] font-medium">
                              {Object.values(order.shippingAddress).filter((value) => typeof value === "string" && value).join(" · ")}
                            </address>
                          )}
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Link href={`/order-confirmation?id=${order.id}`} className="text-xs font-medium text-[var(--color-accent-strong)] underline underline-offset-4">
                              مشاهده کامل سفارش
                            </Link>
                            {order.status === "PENDING" && (
                              <button
                                type="button"
                                disabled={cancellingOrderId === order.id}
                                onClick={() => void handleCancelOrder(order.id)}
                                className="text-xs font-medium text-[var(--color-error)] disabled:opacity-50"
                              >
                                {cancellingOrderId === order.id ? "در حال لغو…" : "لغو سفارش"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Addresses */}
      {view === "addresses" && (
        <div id="addresses-tab">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-wood)]">
              نشانی‌های ذخیره‌شده
            </h2>
            <button
              type="button"
              onClick={() => {
                resetAddressForm();
                setView("profile");
              }}
              className="btn btn-ghost text-sm"
            >
              <Edit3 className="h-4 w-4" /> ویرایش نشانی‌ها
            </button>
          </div>
          {addresses.length === 0 ? (
            <div className="glass-card rounded-[26px] p-10 text-center">
              <div className="glass-pill mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-[var(--color-ink-mute)]">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-wood)]">
                هنوز نشانی‌ای ذخیره نشده
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                برای پرداخت سریع‌تر یک نشانی اضافه کنید.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetAddressForm();
                  setView("profile");
                }}
                className="btn btn-wood mt-4 inline-flex"
              >
                افزودن نشانی
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="glass-card flex gap-4 rounded-[22px] p-4"
                >
                  <div className="glass-pill flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--color-accent-strong)]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-ink)]">
                        {addr.fullName}
                      </span>
                      {addr.isDefault && (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-ink-soft)]">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}
                    </p>
                    <p className="text-sm text-[var(--color-ink-soft)]">
                      {addr.city}
                      {addr.state ? `, ${addr.state}` : ""}
                      {" · "}
                      {addr.postalCode}
                      {" · "}
                      {addr.country}
                    </p>
                    {addr.phone && (
                      <p className="text-sm font-medium text-[var(--color-ink-soft)]">{addr.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditAddress(addr)}
                      className="icon-btn h-8 w-8 cursor-pointer"
                      title="ویرایش نشانی"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="icon-btn h-8 w-8 cursor-pointer"
                      title="انتخاب به‌عنوان پیش‌فرض"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="icon-btn h-8 w-8 cursor-pointer hover:text-[var(--color-error)]"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile */}
      {view === "profile" && (
        <div id="profile-tab">
          <h2 className="text-lg font-semibold text-[var(--color-wood)] mb-4">
            تنظیمات حساب
          </h2>

          {/* Personal info */}
          <div className="glass-card mb-6 rounded-[26px] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-4">
              اطلاعات شخصی
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="نام شما"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                  ایمیل
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="glass-input w-full rounded-xl bg-[var(--color-surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                  تلفن
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="+98 912 000 0000"
                />
              </div>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="btn btn-primary"
              >
                {savingProfile ? "در حال ذخیره…" : "ذخیره تغییرات"}
              </button>
            </div>
          </div>

          <div className="glass-card mb-6 rounded-[26px] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-4">تغییر گذرواژه</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                type="password"
                aria-label="گذرواژه فعلی"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((form) => ({ ...form, currentPassword: event.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                placeholder="گذرواژه فعلی"
                dir="ltr"
              />
              <input
                type="password"
                aria-label="گذرواژه تازه"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((form) => ({ ...form, newPassword: event.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                placeholder="گذرواژه تازه"
                dir="ltr"
              />
              <input
                type="password"
                aria-label="تکرار گذرواژه تازه"
                autoComplete="new-password"
                minLength={8}
                value={passwordForm.confirmation}
                onChange={(event) => setPasswordForm((form) => ({ ...form, confirmation: event.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                placeholder="تکرار گذرواژه تازه"
                dir="ltr"
              />
            </div>
            <button
              type="button"
              onClick={() => void handlePasswordSave()}
              disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="btn btn-ghost mt-4"
            >
              {savingPassword ? "در حال تغییر…" : "تغییر گذرواژه"}
            </button>
          </div>

          {/* Add address */}
          <div className="glass-card rounded-[26px] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-4 flex items-center gap-2">
              {editingAddressId ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingAddressId ? "ویرایش نشانی" : "افزودن نشانی"}
            </h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  value={newAddress.fullName}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, fullName: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="نام و نام خانوادگی"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1">
                  نشانی (خط اول)
                </label>
                <input
                  type="text"
                  value={newAddress.line1}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, line1: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="نشانی خیابان"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1">
                  نشانی (خط دوم، اختیاری)
                </label>
                <input
                  type="text"
                  value={newAddress.line2}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, line2: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="واحد، طبقه و غیره"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1">
                  شهر
                </label>
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, city: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="شهر"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1">
                  استان
                </label>
                <input
                  type="text"
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, state: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="استان"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1">
                  کد پستی
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={10}
                  value={newAddress.postalCode}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, postalCode: e.target.value.replace(/\D/g, "") }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="7134812345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-ink-soft)] mb-1">
                  تلفن (اختیاری)
                </label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, phone: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="+98 912 000 0000"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="new-addr-default"
                  checked={newAddress.isDefault}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, isDefault: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[var(--color-accent)]"
                />
                <label htmlFor="new-addr-default" className="text-sm text-[var(--color-ink-soft)]">
                  به‌عنوان نشانی پیش‌فرض
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleAddAddress}
                disabled={creatingAddress}
                className="btn btn-wood"
              >
                {creatingAddress ? "در حال ذخیره…" : editingAddressId ? "ذخیره ویرایش" : "افزودن نشانی"}
              </button>
              {editingAddressId && (
                <button type="button" onClick={resetAddressForm} className="btn btn-ghost">
                  انصراف
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
