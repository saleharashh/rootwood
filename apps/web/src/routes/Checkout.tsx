import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CreditCard,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { api, type Address, type PaymentGateway } from "@/lib/api";
import { formatPriceToman, toPersianDigits } from "@/lib/price";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { useStoreDialogs } from "@/components/store-dialogs";

export function Checkout() {
  const [, setLocation] = useLocation();
  const { cart, loading: cartLoading } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { openAuthDialog } = useStoreDialogs();

  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("zarinpal");
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

  // New address form
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Load gateways & addresses
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const gwRes = await api.getGateways();
        if (isMounted) {
          setGateways(gwRes.gateways || []);
          if (gwRes.gateways?.length > 0) {
            setSelectedGateway(gwRes.gateways[0].id);
          }
        }
      } catch {
        // default fallback
      }

      if (isAuthenticated) {
        try {
          const addrRes = await api.getAddresses();
          if (isMounted && addrRes.addresses?.length > 0) {
            setSavedAddresses(addrRes.addresses);
            const def = addrRes.addresses.find((a) => a.isDefault) || addrRes.addresses[0];
            setSelectedAddressId(def.id);
          }
        } catch {
          // ignore
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (user && !recipientName) {
      setRecipientName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const items = cart?.items || [];
  const subtotal = cart?.summary?.subtotal ?? 0;
  const shipping = cart?.summary?.shipping ?? 0;
  const total = cart?.summary?.total ?? subtotal + shipping;

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-900/20 border-t-amber-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-stone-900">سبد خرید شما خالی است</h1>
        <p className="text-stone-600 text-sm">برای ثبت سفارش ابتدا کالایی به سبد خرید اضافه کنید.</p>
        <Link
          href="/products"
          className="inline-block bg-amber-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-800 transition"
        >
          مشاهده کاتالوگ محصولات
        </Link>
      </div>
    );
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast("لطفاً برای ثبت نهایی سفارش، ابتدا وارد حساب کاربری خود شوید", "info");
      openAuthDialog();
      return;
    }

    // Prepare address
    let finalAddress: {
      recipientName: string;
      phone: string;
      province: string;
      city: string;
      street: string;
      postalCode: string;
    };

    if (selectedAddressId !== "new") {
      const chosen = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!chosen) {
        showToast("لطفاً آدرس ارسال را انتخاب نمایید", "error");
        return;
      }
      finalAddress = {
        recipientName: chosen.recipientName,
        phone: chosen.phone,
        province: chosen.province,
        city: chosen.city,
        street: chosen.street,
        postalCode: chosen.postalCode || "",
      };
    } else {
      if (!recipientName.trim() || !phone.trim() || !street.trim()) {
        showToast("لطفاً تمامی فیلدهای الزامی آدرس را کامل فرمایید", "error");
        return;
      }
      finalAddress = {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        province: province.trim(),
        city: city.trim(),
        street: street.trim(),
        postalCode: postalCode.trim(),
      };
    }

    setSubmitting(true);
    try {
      // 1. Create order
      const orderRes = await api.createOrder({
        shippingAddress: {
          ...finalAddress,
          fullName: finalAddress.recipientName,
          line1: finalAddress.street,
          state: finalAddress.province,
        },
        note: customerNote.trim() || undefined,
        customerNote: customerNote.trim() || undefined,
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
      });

      const orderId = orderRes.order.id;

      // 2. Initiate payment
      const callbackUrl = `${window.location.origin}/checkout/callback`;
      const payRes = await api.initiatePayment({
        orderId,
        gateway: selectedGateway,
        callbackUrl,
      });

      showToast("در حال انتقال به درگاه پرداخت شاپرک...", "info");
      window.location.href = payRes.paymentUrl;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ایجاد سفارش یا اتصال به درگاه", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-stone-50/50 min-h-[80vh] pb-20">
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-stone-500">
            <Link href="/" className="hover:text-amber-900 transition">خانه</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-amber-900 transition">سبد خرید</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">تسویه حساب و پرداخت</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif mb-8">
          مشخصات ارسال و درگاه پرداخت
        </h1>

        {!isAuthenticated && (
          <div className="mb-8 bg-amber-50 border border-amber-200/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-amber-900 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-stone-900">حساب کاربری دارید؟</h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  برای ذخیره سابقه سفارش و استفاده از آدرس‌های قبلی، وارد شوید.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAuthDialog()}
              className="bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              ورود با پیامک یا رمز عبور
            </button>
          </div>
        )}

        <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main content - 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Shipping Address */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg border-b border-stone-100 pb-3">
                <MapPin className="w-5 h-5 text-amber-800" />
                <span>۱. نشانی و اطلاعات تحویل‌گیرنده</span>
              </div>

              {/* Saved addresses selector */}
              {isAuthenticated && savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-stone-700 block">انتخاب از آدرس‌های ذخیره‌شده:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? "border-amber-900 bg-amber-50/50 ring-1 ring-amber-900"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex justify-between font-bold text-stone-800 mb-1">
                          <span>{addr.recipientName}</span>
                          <span className="text-stone-500 font-normal">{addr.phone}</span>
                        </div>
                        <p className="text-stone-600 line-clamp-2 leading-relaxed">
                          {addr.province}، {addr.city}، {addr.street}
                        </p>
                      </div>
                    ))}

                    <div
                      onClick={() => setSelectedAddressId("new")}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-center gap-2 text-stone-600 ${
                        selectedAddressId === "new"
                          ? "border-amber-900 bg-amber-50/50 ring-1 ring-amber-900 text-amber-900 font-semibold"
                          : "border-dashed border-stone-300 hover:border-stone-400"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>ورود نشانی تحویل جدید</span>
                    </div>
                  </div>
                </div>
              )}

              {/* New address input fields */}
              {(selectedAddressId === "new" || savedAddresses.length === 0) && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        نام و نام خانوادگی تحویل‌گیرنده *
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        required
                        placeholder="مثال: آرش سلیمی"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        شماره تماس تحویل‌گیرنده *
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="09123456789"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">استان *</label>
                      <input
                        type="text"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        required
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">شهر *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">کد پستی ده رقمی</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="1234567890"
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">نشانی دقیق پستی *</label>
                    <textarea
                      rows={2}
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      required
                      placeholder="خیابان، کوچه، پلاک، واحد..."
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                    />
                  </div>
                </div>
              )}

              {/* Order note */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  توضیحات تکمیلی یا زمان مناسب تحویل (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="مثال: لطفاً قبل از ارسال تماس گرفته شود یا تحویل در ساعات بعدازظهر..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900"
                />
              </div>
            </div>

            {/* Section 2: Payment Gateway Selection */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg border-b border-stone-100 pb-3">
                <CreditCard className="w-5 h-5 text-amber-800" />
                <span>۲. درگاه پرداخت الکترونیک شاپرک</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {gateways.map((gw) => (
                  <label
                    key={gw.id}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      selectedGateway === gw.id
                        ? "border-amber-900 bg-amber-50/50 ring-1 ring-amber-900"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="gateway"
                        value={gw.id}
                        checked={selectedGateway === gw.id}
                        onChange={() => setSelectedGateway(gw.id)}
                        className="text-amber-900 focus:ring-amber-900 h-4 w-4"
                      />
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{gw.name}</div>
                        <div className="text-xs text-stone-500">{gw.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <p className="text-xs text-stone-500 leading-relaxed flex items-center gap-1.5 pt-1">
                <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                اتصال امن شاپرک با پروتکل رمزنگاری SSL و تأیید مستقیم تراکنش بانکی.
              </p>
            </div>
          </div>

          {/* Sidebar - 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5 sticky top-24">
              <h2 className="text-lg font-bold text-stone-900 font-serif border-b border-stone-100 pb-3">
                اقلام این سفارش
              </h2>

              {/* Items summary */}
              <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-stone-100">
                {items.map((it) => (
                  <div key={it.id} className="pt-2 first:pt-0 flex items-center gap-3">
                    <img
                      src={it.product.imageUrl || "/images/placeholder.jpg"}
                      alt={it.product.title}
                      className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">{it.product.title}</div>
                      <div className="text-[11px] text-stone-500">
                        {toPersianDigits(it.quantity)} × {formatPriceToman(it.product.price)}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-stone-900">
                      {formatPriceToman(it.product.price * it.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price summary */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>مجموع کالاها:</span>
                  <span>{formatPriceToman(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>هزینه بسته‌بندی و ارسال:</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-700 font-bold">رایگان</span>
                    ) : (
                      formatPriceToman(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-baseline font-bold pt-3 border-t border-stone-100">
                  <span className="text-stone-900">مبلغ نهایی پرداخت:</span>
                  <span className="text-xl font-extrabold text-[#b85d19] font-serif">
                    {formatPriceToman(total)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>در حال اتصال به بانک...</span>
                  </>
                ) : (
                  <>
                    <span>پرداخت و ثبت سفارش</span>
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-xs text-stone-500 space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                  <span>تأییدیه پیامکی و فاکتور رسمی پس از پرداخت</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-800" />
                  <span>آماده‌سازی تخصصی در آتلیه چوب</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
