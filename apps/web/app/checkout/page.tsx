"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { formatPrice } from "@/lib/price";
import { createOrder, getAddresses, getPaymentGateways, initiatePayment, type Address } from "@/lib/api";
import { PageSkeleton } from "@/components/loading";
import { Trash2, ArrowLeft, CircleAlert, ShoppingBag, CreditCard } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function CheckoutPage() {
  const { cart, loading, error: cartError, loadCart, removeItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [gateway, setGateway] = useState<"zarinpal" | "zibal">("zarinpal");
  const [gatewayAvailability, setGatewayAvailability] = useState<
    Record<string, boolean>
  >({});
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [address, setAddress] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    isDefault: false,
  });
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let cancelled = false;
    getPaymentGateways()
      .then((items) => {
        if (cancelled) return;
        const availability: Record<string, boolean> = {};
        for (const item of items) availability[item.id] = item.isAvailable;
        setGatewayAvailability(availability);
        setGateway((current) => {
          if (availability[current] !== false) return current;
          const fallback = items.find((item) => item.isAvailable);
          return (fallback?.id as "zarinpal" | "zibal" | undefined) ?? current;
        });
      })
      .catch(() => {
        // The API reports unconfigured gateways on submit; keep the default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAddresses()
      .then((items) => {
        if (cancelled) return;
        setSavedAddresses(items);
        setAddress((current) => ({
          ...current,
          fullName: current.fullName || user.name,
          phone: current.phone || user.phone || "",
        }));
        const preferred = items.find((item) => item.isDefault) ?? items[0];
        if (preferred) {
          setSelectedAddressId(preferred.id);
          setAddress({
            fullName: preferred.fullName,
            line1: preferred.line1,
            line2: preferred.line2 ?? "",
            city: preferred.city,
            state: preferred.state ?? "",
            postalCode: preferred.postalCode,
            phone: preferred.phone ?? user.phone ?? "",
            isDefault: false,
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAddress((current) => ({
            ...current,
            fullName: current.fullName || user.name,
            phone: current.phone || user.phone || "",
          }));
          toast(error instanceof Error ? error.message : "دریافت نشانی‌ها ممکن نشد", "error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, toast]);

  function selectAddress(id: string) {
    setSelectedAddressId(id);
    setErrors({});
    if (id === "new") {
      setAddress({
        fullName: user?.name ?? "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        phone: user?.phone ?? "",
        isDefault: false,
      });
      return;
    }
    const selected = savedAddresses.find((item) => item.id === id);
    if (!selected) return;
    setAddress({
      fullName: selected.fullName,
      line1: selected.line1,
      line2: selected.line2 ?? "",
      city: selected.city,
      state: selected.state ?? "",
      postalCode: selected.postalCode,
      phone: selected.phone ?? "",
      isDefault: false,
    });
  }

  if (loading || authLoading || !user) {
    return <PageSkeleton />;
  }
  if (cartError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="glass-card rounded-[28px] p-10">
          <div className="glass-pill mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[var(--color-error)]">
            <CircleAlert className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-lg text-[var(--color-error)]">{cartError}</p>
          <button type="button" onClick={() => void loadCart()} className="btn btn-primary mt-4">
            تلاش دوباره
          </button>
        </div>
      </div>
    );
  }
  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="glass-card rounded-[28px] p-10">
          <div className="glass-pill mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[var(--color-ink-mute)]">
            <ShoppingBag className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="text-lg text-[var(--color-ink-soft)]">سبد خرید شما خالی است.</p>
          <Link
            href="/products"
            className="btn btn-primary mt-4"
          >
            دیدن مجموعه
          </Link>
        </div>
      </div>
    );
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!address.fullName.trim()) errs.fullName = "نام و نام خانوادگی لازم است";
    if (!address.line1.trim()) errs.line1 = "نشانی لازم است";
    if (!address.city.trim()) errs.city = "شهر لازم است";
    if (!/^\d{10}$/.test(address.postalCode.trim())) {
      errs.postalCode = "کد پستی باید ۱۰ رقم انگلیسی باشد";
    }
    if (address.phone.trim() && !/^[+\d][\d\s-]{7,19}$/.test(address.phone.trim())) {
      errs.phone = "شماره تماس نامعتبر است";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !validate()) return;
    if (
      gatewayAvailability.zarinpal === false &&
      gatewayAvailability.zibal === false
    ) {
      toast(
        "هیچ درگاه پرداخت فعالی پیکربندی نشده است. لطفاً بعداً تلاش کنید یا با پشتیبانی تماس بگیرید.",
        "error",
      );
      return;
    }
    setCreating(true);
    try {
      const order = await createOrder(null, {
        shippingAddress: {
          fullName: address.fullName.trim(),
          line1: address.line1.trim(),
          line2: address.line2.trim() || undefined,
          city: address.city.trim(),
          state: address.state.trim() || undefined,
          postalCode: address.postalCode.trim(),
          country: "IR",
          phone: address.phone.trim() || undefined,
          isDefault: address.isDefault,
        },
        saveAddress: selectedAddressId === "new" && address.isDefault,
        note: note.trim() || undefined,
      });

      toast(`سفارش ${order.orderNumber} ثبت شد؛ در حال اتصال به درگاه پرداخت...`, "success");

      const payment = await initiatePayment(null, {
        orderId: order.id,
        gateway,
      });

      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      } else {
        router.push(`/order-confirmation?id=${order.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "در ثبت سفارش یا اتصال به درگاه مشکلی پیش آمد.";
      toast(message, "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xs">
        <div className="relative">
          <span className="inline-block rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)]">
            مرحله پایانی خرید
          </span>
          <h1 className="mt-3 text-2xl font-bold text-[var(--color-wood)] sm:text-3xl">
            تکمیل نشانی و تسویه سفارش
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            اطلاعات تحویل کالا و پیش‌فاکتور خود را بررسی کرده و سفارش خود را نهایی کنید.
          </p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Shipping */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--color-wood)] mb-4 border-b border-[var(--color-border)] pb-3">
              نشانی دقیق تحویل
            </h2>
            {savedAddresses.length > 0 && (
              <div className="mb-5">
                <label htmlFor="saved-address" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                  انتخاب نشانی ذخیره‌شده
                </label>
                <select
                  id="saved-address"
                  value={selectedAddressId}
                  onChange={(event) => selectAddress(event.target.value)}
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  {savedAddresses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fullName} · {item.city} · {item.line1}
                    </option>
                  ))}
                  <option value="new">نشانی تازه</option>
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-fullName"
                  className="mb-1 block text-sm font-medium text-[var(--color-ink)]"
                >
                  نام و نام خانوادگی
                </label>
                <input
                  id="checkout-fullName"
                  type="text"
                  value={address.fullName}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, fullName: e.target.value }))
                  }
                  className={`glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none ${
                    errors.fullName ? "glass-input-error" : ""
                  }`}
                  placeholder="سامی رحیمی"
                  autoComplete="name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{errors.fullName}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-line1"
                  className="mb-1 block text-sm font-medium text-[var(--color-ink)]"
                >
                  نشانی (خط اول)
                </label>
                <input
                  id="checkout-line1"
                  type="text"
                  value={address.line1}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, line1: e.target.value }))
                  }
                  className={`glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none ${
                    errors.line1 ? "glass-input-error" : ""
                  }`}
                  placeholder="کوچه خشت، محله قدیم"
                  autoComplete="address-line1"
                />
                {errors.line1 && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{errors.line1}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-line2"
                  className="mb-1 block text-sm font-medium text-[var(--color-ink)]"
                >
                  نشانی (خط دوم، اختیاری)
                </label>
                <input
                  id="checkout-line2"
                  type="text"
                  value={address.line2}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, line2: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="ساختمان، طبقه یا واحد"
                  autoComplete="address-line2"
                />
              </div>
              <div>
                <label
                  htmlFor="checkout-city"
                  className="mb-1 block text-sm font-medium text-[var(--color-ink)]"
                >
                  شهر
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  value={address.city}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, city: e.target.value }))
                  }
                  className={`glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none ${
                    errors.city ? "glass-input-error" : ""
                  }`}
                  placeholder="شیراز"
                  autoComplete="address-level2"
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{errors.city}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="checkout-state"
                  className="mb-1 block text-sm font-medium text-[var(--color-ink)]"
                >
                  استان
                </label>
                <input
                  id="checkout-state"
                  type="text"
                  value={address.state}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, state: e.target.value }))
                  }
                  className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  placeholder="فارس"
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <label
                  htmlFor="checkout-postal"
                  className="mb-1 block text-sm font-medium text-[var(--color-ink)]"
                >
                  کد پستی
                </label>
                <input
                  id="checkout-postal"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={10}
                  value={address.postalCode}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, postalCode: e.target.value.replace(/\D/g, "") }))
                  }
                  className={`glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none ${
                    errors.postalCode ? "glass-input-error" : ""
                  }`}
                  placeholder="7134812345"
                  autoComplete="postal-code"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{errors.postalCode}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="checkout-phone"
                  className="mb-1 block text-sm font-medium text-[var(--color-ink)]"
                >
                  تلفن (اختیاری)
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={address.phone}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, phone: e.target.value }))
                  }
                  className={`glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none ${
                    errors.phone ? "glass-input-error" : ""
                  }`}
                  placeholder="+989120000000"
                  dir="ltr"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">{errors.phone}</p>
                )}
              </div>
              {selectedAddressId === "new" && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="set-default"
                    checked={address.isDefault}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, isDefault: e.target.checked }))
                    }
                    className="h-4 w-4 cursor-pointer rounded border-white/60 accent-[var(--color-accent)]"
                  />
                  <label htmlFor="set-default" className="cursor-pointer text-sm text-[var(--color-ink-soft)]">
                    ذخیره به‌عنوان نشانی پیش‌فرض
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--color-wood)] mb-2">
              یادداشت برای کارگاه (اختیاری)
            </h2>
            <textarea
              id="checkout-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="glass-input w-full resize-y rounded-xl px-3.5 py-2.5 text-sm outline-none"
              placeholder="دستورهای تحویل، بسته‌بندی هدیه یا هر نکته‌ای که کارگاه باید بداند"
            />
          </div>

          {/* Payment Gateway Selector */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2 border-b border-[var(--color-border)] pb-3">
              <CreditCard className="h-5 w-5 text-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-wood)]">
                انتخاب درگاه پرداخت اینترنتی
              </h2>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-[var(--color-ink-soft)]">
              کلیه تراکنش‌ها از طریق شاپرک و با پروتکل‌های رمزنگاری‌شده امن انجام می‌پذیرد.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label
                className={`relative flex cursor-pointer items-start justify-between rounded-xl border p-4 transition-all ${
                  gatewayAvailability.zarinpal === false
                    ? "cursor-not-allowed border-dashed border-[var(--color-border)] opacity-60"
                    : gateway === "zarinpal"
                      ? "border-[var(--color-accent)] bg-amber-50/50 ring-1 ring-[var(--color-accent)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-ink-mute)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="gateway"
                    value="zarinpal"
                    checked={gateway === "zarinpal"}
                    onChange={() => setGateway("zarinpal")}
                    disabled={gatewayAvailability.zarinpal === false}
                    className="mt-1 h-4 w-4 text-[var(--color-accent)] accent-[var(--color-accent)]"
                  />
                  <div>
                    <span className="block text-sm font-bold text-[var(--color-wood)]">
                      درگاه زرین‌پال
                    </span>
                    <span className="block text-xs text-[var(--color-ink-soft)] mt-1">
                      پرداخت امن شاپرک با کلیه کارت‌های شتاب
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                  {gatewayAvailability.zarinpal === false ? "در دسترس نیست" : "زرین‌پال"}
                </span>
              </label>

              <label
                className={`relative flex cursor-pointer items-start justify-between rounded-xl border p-4 transition-all ${
                  gatewayAvailability.zibal === false
                    ? "cursor-not-allowed border-dashed border-[var(--color-border)] opacity-60"
                    : gateway === "zibal"
                      ? "border-[var(--color-accent)] bg-sky-50/50 ring-1 ring-sky-500"
                      : "border-[var(--color-border)] hover:border-[var(--color-ink-mute)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="gateway"
                    value="zibal"
                    checked={gateway === "zibal"}
                    onChange={() => setGateway("zibal")}
                    disabled={gatewayAvailability.zibal === false}
                    className="mt-1 h-4 w-4 text-[var(--color-accent)] accent-[var(--color-accent)]"
                  />
                  <div>
                    <span className="block text-sm font-bold text-[var(--color-wood)]">
                      درگاه زیبال
                    </span>
                    <span className="block text-xs text-[var(--color-ink-soft)] mt-1">
                      درگاه واسط رسمی با تایید و تسویه سریع
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-900">
                  {gatewayAvailability.zibal === false ? "در دسترس نیست" : "زیبال"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="sticky top-[5.5rem] h-fit rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xs">
          <h2 className="text-lg font-bold text-[var(--color-wood)] mb-4 border-b border-[var(--color-border)] pb-3">
            پیش‌فاکتور سفارش
          </h2>
          <div className="space-y-2.5">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5"
              >
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-white border border-[var(--color-border)]">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[var(--color-ink)]">
                    {item.product.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-ink-mute)]">
                    {item.quantity.toLocaleString("fa-IR")} × {formatPrice(item.product.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void removeItem(item.id)
                      .then(() => toast("کالا حذف شد", "info"))
                      .catch((error: unknown) => toast(error instanceof Error ? error.message : "حذف کالا ممکن نشد", "error"));
                  }}
                  className="icon-btn h-7 w-7 shrink-0 cursor-pointer hover:text-[var(--color-error)]"
                  aria-label="حذف کالا"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <dl className="mt-5 space-y-2.5 border-t border-[var(--color-border)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-ink-soft)]">جمع کالاها</dt>
              <dd className="font-semibold text-[var(--color-ink)]">
                {formatPrice(cart.summary.subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-ink-soft)]">هزینه ارسال امن</dt>
              <dd className={`font-semibold ${cart.summary.shipping === 0 ? "text-[var(--color-success)]" : "text-[var(--color-ink)]"}`}>
                {cart.summary.shipping === 0
                  ? "رایگان"
                  : formatPrice(cart.summary.shipping)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
              <dt className="font-bold text-[var(--color-ink)]">مبلغ کل قابل پرداخت</dt>
              <dd className="text-xl font-extrabold text-[var(--color-wood)]">
                {formatPrice(cart.summary.total)}
              </dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={
              creating ||
              (gatewayAvailability.zarinpal === false &&
                gatewayAvailability.zibal === false)
            }
            className="btn btn-primary mt-6 w-full py-3.5 text-base font-bold shadow-xs disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? (
              <>
                <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-current" />
                در حال انتقال به درگاه…
              </>
            ) : (
              <>
                پرداخت با {gateway === "zarinpal" ? "زرین‌پال" : "زیبال"}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--color-ink-mute)]">
            با ثبت این سفارش، شرایط و سیاست تحویل ما را می‌پذیرید.
          </p>
        </div>
      </form>
    </div>
  );
}
