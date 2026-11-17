import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Plus,
  ShieldCheck,
  User,
} from "lucide-react";
import { api, type Address, type Order } from "@/lib/api";
import { formatPriceToman, toPersianDigits } from "@/lib/price";
import { SITE_CONTACT } from "@/lib/site-config";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useStoreDialogs } from "@/components/store-dialogs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PriceSummary } from "@/components/price-summary";
import {
  isPlaceholderUserName,
  normalizeIranianPhone,
  normalizePostalCode,
} from "@/lib/validation";

interface ShippingFields {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  street: string;
  postalCode: string;
}

type FieldErrors = Partial<Record<keyof ShippingFields, string>>;

const EMPTY_FIELDS: ShippingFields = {
  recipientName: "",
  phone: "",
  province: "",
  city: "",
  street: "",
  postalCode: "",
};

function validateShipping(fields: ShippingFields) {
  const errors: FieldErrors = {};
  const cleaned: ShippingFields = {
    recipientName: fields.recipientName.trim(),
    phone: normalizeIranianPhone(fields.phone) || "",
    province: fields.province.trim(),
    city: fields.city.trim(),
    street: fields.street.trim(),
    postalCode: normalizePostalCode(fields.postalCode) || "",
  };

  if (cleaned.recipientName.length < 3 || isPlaceholderUserName(cleaned.recipientName)) {
    errors.recipientName = "نام و نام خانوادگی تحویل‌گیرنده را کامل وارد کنید";
  }
  if (!cleaned.phone) {
    errors.phone = "شمارهٔ موبایل معتبر وارد کنید (مانند 09123456789)";
  }
  if (cleaned.province.length < 2) {
    errors.province = "استان را وارد کنید";
  }
  if (cleaned.city.length < 2) {
    errors.city = "شهر را وارد کنید";
  }
  if (!cleaned.postalCode) {
    errors.postalCode = "کد پستی باید ۱۰ رقم باشد";
  }
  if (cleaned.street.length < 10) {
    errors.street = "نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) را کامل بنویسید";
  }

  return { errors, cleaned };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] font-medium text-red-700">{message}</p>;
}

export function Checkout() {
  const {
    cart,
    initialLoading: cartLoading,
    refreshCart,
    subtotal,
    shipping,
    total,
  } = useCart();
  const { user, isAuthenticated, isProfileComplete, loading: authLoading, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { openAuth } = useStoreDialogs();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [fields, setFields] = useState<ShippingFields>(EMPTY_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [zarinpalReady, setZarinpalReady] = useState(false);

  useEffect(() => {
    if (!submittedOrder) return;
    let active = true;

    api
      .getGateways()
      .then(({ gateways }) => {
        if (!active) return;
        const zarinpal = gateways.find((gateway) => gateway.id === "zarinpal");
        setZarinpalReady(Boolean(zarinpal?.isAvailable));
      })
      .catch(() => {
        if (active) setZarinpalReady(false);
      });

    return () => {
      active = false;
    };
  }, [submittedOrder]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedAddresses([]);
      setSelectedAddressId("new");
      return;
    }

    let active = true;
    api
      .getAddresses()
      .then((response) => {
        if (!active) return;
        const addresses = response.addresses || [];
        setSavedAddresses(addresses);
        const preferred = addresses.find((address) => address.isDefault) || addresses[0];
        setSelectedAddressId(preferred ? preferred.id : "new");
      })
      .catch(() => {
        // Keep the manual form available when the address book fails.
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    setFields((current) => ({
      ...current,
      recipientName:
        current.recipientName ||
        (!isPlaceholderUserName(user.name) ? user.name : ""),
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  const items = cart?.items || [];
  const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId);

  const updateField = (key: keyof ShippingFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(SITE_CONTACT.phone);
      setCopiedPhone(true);
      showToast("شمارهٔ ایتا کپی شد", "success");
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch {
      showToast(`شمارهٔ تماس: ${SITE_CONTACT.phone}`, "info");
    }
  };

  async function handleOnlinePayment() {
    if (!submittedOrder || paying) return;
    setPaying(true);
    try {
      const payment = await api.initiatePayment({
        orderId: submittedOrder.id,
        gateway: "zarinpal",
      });
      if (payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }
      showToast("لینک پرداخت از درگاه دریافت نشد", "error");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "خطا در اتصال به درگاه پرداخت", "error");
    } finally {
      setPaying(false);
    }
  }

  if (submittedOrder) {
    const orderCode = submittedOrder.orderNumber || submittedOrder.id;
    const finalTotal = submittedOrder.totalAmount || submittedOrder.total || total;

    return (
      <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-extrabold text-[var(--color-ink)]">
              سفارش شما ثبت شد
            </h1>
            <p className="text-xs leading-relaxed text-[var(--color-ink-soft)] sm:text-sm">
              می‌توانید همین حالا مبلغ سفارش را آنلاین پرداخت کنید یا برای هماهنگی پرداخت و پیگیری
              ساخت اثر از طریق پیام‌رسان ایتا در تماس باشید.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-canvas)] p-4">
            <div className="text-[11px] font-bold text-[var(--color-accent)]">
              شمارهٔ ایتا و تماس
            </div>
            <a
              href={SITE_CONTACT.telHref}
              dir="ltr"
              className="block font-mono text-2xl font-black text-[var(--color-ink)] hover:text-[var(--color-accent)]"
            >
              {SITE_CONTACT.phone}
            </a>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyPhone}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[var(--color-accent-hover)]"
              >
                {copiedPhone ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedPhone ? "کپی شد" : "کپی شماره"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(orderCode);
                    showToast("کد پیگیری کپی شد", "success");
                  } catch {
                    showToast(`کد پیگیری: ${orderCode}`, "info");
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-surface-2)]"
              >
                <Copy className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                کپی کد پیگیری
              </button>
            </div>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between text-[var(--color-ink-soft)]">
              <span>کد پیگیری سفارش</span>
              <span className="font-mono font-bold text-[var(--color-ink)]" dir="ltr">
                {orderCode}
              </span>
            </div>
            <div className="flex items-center justify-between text-[var(--color-ink-soft)]">
              <span>مبلغ قابل پرداخت</span>
              <span className="font-serif font-bold text-[var(--color-accent)]">
                {formatPriceToman(finalTotal)}
              </span>
            </div>
          </div>

          {zarinpalReady && (
            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleOnlinePayment}
                disabled={paying}
                className="w-full gap-2"
              >
                {paying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    در حال اتصال به درگاه…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    پرداخت آنلاین با زرین‌پال
                  </>
                )}
              </Button>
              <p className="text-[11px] text-[var(--color-ink-muted)]">
                یا هماهنگی پرداخت از طریق ایتا با شمارهٔ بالا
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <Link href={`/track?code=${encodeURIComponent(orderCode)}`} className="flex-1">
              <Button className="w-full gap-2">
                <PackageCheck className="h-4 w-4" />
                مشاهدهٔ وضعیت سفارش
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                بازگشت به فروشگاه
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartLoading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)]/20 border-t-[var(--color-accent)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<PackageCheck className="h-7 w-7" />}
          title="سبد خرید شما خالی است"
          description="برای ثبت سفارش ابتدا اثری از کاتالوگ به سبد خرید اضافه کنید."
          action={
            <Link href="/products">
              <Button>مشاهدهٔ کاتالوگ</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated) {
      showToast("برای ثبت سفارش با شمارهٔ موبایل وارد شوید", "info");
      openAuth();
      return;
    }

    const chosen = selectedAddressId !== "new" ? selectedAddress : undefined;
    const usingSavedAddress = !!chosen;
    const rawFields: ShippingFields = chosen
      ? {
          recipientName: chosen.recipientName || "",
          phone: chosen.phone || "",
          province: chosen.province || "",
          city: chosen.city || "",
          street: chosen.street || "",
          postalCode: chosen.postalCode || "",
        }
      : fields;

    const { errors, cleaned } = validateShipping(rawFields);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (usingSavedAddress) {
        setFields(rawFields);
        setSelectedAddressId("new");
        showToast("این نشانی کامل نیست؛ لطفاً فیلدهای مشخص‌شده را کامل کنید", "error");
      } else {
        showToast("لطفاً خطاهای فرم نشانی را برطرف کنید", "error");
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.createOrder({
        shippingAddress: {
          ...cleaned,
          fullName: cleaned.recipientName,
          line1: cleaned.street,
          state: cleaned.province,
        },
        note: customerNote.trim() || undefined,
        customerNote: customerNote.trim() || undefined,
        saveAddress: usingSavedAddress ? false : saveAddress,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      setSubmittedOrder(response.order);
      await refreshCart();
      if (!isProfileComplete) {
        await refreshUser();
      }
      showToast("سفارش ثبت شد؛ برای هماهنگی پرداخت از ایتا پیگیری کنید", "success");
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "خطا در ثبت سفارش", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: "ورود به حساب", done: isAuthenticated },
    { id: 2, label: "نشانی تحویل", done: isAuthenticated && items.length > 0 },
    { id: 3, label: "تأیید و ثبت", done: false },
  ];

  return (
    <div className="min-h-[80vh] pb-20">
      <div className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-[var(--color-ink-muted)] sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-accent)]">
              خانه
            </Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-[var(--color-accent)]">
              سبد خرید
            </Link>
            <span>/</span>
            <span className="font-medium text-[var(--color-ink)]">تکمیل سفارش</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="mb-5 font-serif text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
          تکمیل سفارش
        </h1>

        <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          {steps.map((step) => (
            <li
              key={step.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
                step.done
                  ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-800"
                  : step.id === (isAuthenticated ? 2 : 1)
                    ? "border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-ink-muted)]"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  step.done
                    ? "bg-emerald-700 text-white"
                    : step.id === (isAuthenticated ? 2 : 1)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]"
                }`}
              >
                {step.done ? <Check className="h-3 w-3" /> : toPersianDigits(step.id)}
              </span>
              {step.label}
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            {!isAuthenticated && (
              <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-accent-border)] bg-white text-[var(--color-accent)]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--color-ink)]">
                      ۱. با شمارهٔ موبایل وارد شوید
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                      برای ثبت سفارش و تأیید شمارهٔ تماس، ورود با کد پیامکی لازم است.
                    </p>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={openAuth} className="shrink-0">
                  ورود با شمارهٔ موبایل
                </Button>
              </section>
            )}

            <section
              id="shipping-section"
              className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-3 font-serif text-lg font-bold text-[var(--color-ink)]">
                <MapPin className="h-5 w-5 text-[var(--color-accent)]" />
                نشانی تحویل
              </div>

              {isAuthenticated && savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--color-ink-soft)]">از نشانی‌های ذخیره‌شده انتخاب کنید:</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {savedAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`rounded-xl border p-3.5 text-right text-xs transition ${
                          selectedAddressId === address.id
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/60 ring-1 ring-[var(--color-accent)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 font-bold text-[var(--color-ink)]">
                          <span>{address.recipientName}</span>
                          <span className="font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                            {address.phone}
                          </span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-[var(--color-ink-soft)]">
                          {address.province}، {address.city}، {address.street}
                        </p>
                        {address.postalCode && (
                          <div className="mt-1 font-mono text-[11px] text-[var(--color-ink-muted)]" dir="ltr">
                            {address.postalCode}
                          </div>
                        )}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setSelectedAddressId("new")}
                      className={`flex items-center justify-center gap-2 rounded-xl border border-dashed p-3.5 text-xs transition ${
                        selectedAddressId === "new"
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/60 font-semibold text-[var(--color-accent)]"
                          : "border-[var(--color-border-strong)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]/50"
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      نشانی جدید
                    </button>
                  </div>
                </div>
              )}

              {(selectedAddressId === "new" || savedAddresses.length === 0) && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                        نام تحویل‌گیرنده *
                      </label>
                      <input
                        type="text"
                        value={fields.recipientName}
                        onChange={(event) => updateField("recipientName", event.target.value)}
                        placeholder="آرش سلیمی"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/20 ${
                          fieldErrors.recipientName
                            ? "border-red-300"
                            : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                        }`}
                      />
                      <FieldError message={fieldErrors.recipientName} />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                        شمارهٔ موبایل تحویل‌گیرنده *
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        dir="ltr"
                        value={fields.phone}
                        onChange={(event) => updateField("phone", event.target.value)}
                        placeholder="09123456789"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-left font-mono text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/20 ${
                          fieldErrors.phone
                            ? "border-red-300"
                            : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                        }`}
                      />
                      <FieldError message={fieldErrors.phone} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                        استان *
                      </label>
                      <input
                        type="text"
                        value={fields.province}
                        onChange={(event) => updateField("province", event.target.value)}
                        placeholder="یزد"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/20 ${
                          fieldErrors.province
                            ? "border-red-300"
                            : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                        }`}
                      />
                      <FieldError message={fieldErrors.province} />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                        شهر *
                      </label>
                      <input
                        type="text"
                        value={fields.city}
                        onChange={(event) => updateField("city", event.target.value)}
                        placeholder="یزد"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/20 ${
                          fieldErrors.city
                            ? "border-red-300"
                            : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                        }`}
                      />
                      <FieldError message={fieldErrors.city} />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                        کد پستی ۱۰ رقمی *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        dir="ltr"
                        value={fields.postalCode}
                        onChange={(event) => updateField("postalCode", event.target.value)}
                        placeholder="1234567890"
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-left font-mono text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/20 ${
                          fieldErrors.postalCode
                            ? "border-red-300"
                            : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                        }`}
                      />
                      <FieldError message={fieldErrors.postalCode} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                      نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) *
                    </label>
                    <textarea
                      rows={2}
                      value={fields.street}
                      onChange={(event) => updateField("street", event.target.value)}
                      placeholder="خیابان، کوچه، پلاک، طبقه، واحد..."
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]/20 ${
                        fieldErrors.street
                          ? "border-red-300"
                          : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                      }`}
                    />
                    <FieldError message={fieldErrors.street} />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-[var(--color-ink-soft)]">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                      className="rounded border-[var(--color-border-strong)] accent-[var(--color-accent)]"
                    />
                    ذخیرهٔ این نشانی در حساب کاربری
                  </label>
                </div>
              )}

              <div className="pt-1">
                <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                  توضیحات یا زمان مناسب تحویل (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder="مثال: پیش از ارسال تماس گرفته شود."
                  className="w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                />
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-serif text-base font-bold text-[var(--color-ink)]">
                <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
                تأیید نهایی
              </h2>
              <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">
                {isAuthenticated
                  ? "پس از ثبت، کد پیگیری سفارش نمایش داده می‌شود و هماهنگی پرداخت از طریق ایتا انجام می‌گیرد."
                  : "برای تکمیل و ثبت سفارش، ابتدا با شمارهٔ موبایل وارد شوید."}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-ink-muted)]">
                <span>پرداخت پس از تأیید کارگاه</span>
                <span>•</span>
                <span>بسته‌بندی چوبی ضد ضربه</span>
                <span>•</span>
                <span>شناسنامهٔ اصالت چوب</span>
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <h2 className="border-b border-[var(--color-border-subtle)] pb-3 font-serif text-lg font-bold text-[var(--color-ink)]">
                اقلام سفارش
              </h2>

              <div className="max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.product.imageUrl || "/images/workshop.webp"}
                      alt={item.product.title}
                      className="h-12 w-12 shrink-0 rounded-lg border border-[var(--color-border)] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-[var(--color-ink)]">
                        {item.product.title}
                      </div>
                      <div className="text-[11px] text-[var(--color-ink-muted)]">
                        {toPersianDigits(item.quantity)} × {formatPriceToman(item.product.price)}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[var(--color-ink)]">
                      {formatPriceToman(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <PriceSummary subtotal={subtotal} shipping={shipping} total={total} />

              {isAuthenticated ? (
                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      در حال ثبت سفارش…
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4" />
                      ثبت سفارش و دریافت کد پیگیری
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={openAuth} className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  ورود برای ثبت سفارش
                </Button>
              )}

              <p className="text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                با ثبت سفارش، شرایط ساخت و ارسال آثار دست‌ساز را می‌پذیرید.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
