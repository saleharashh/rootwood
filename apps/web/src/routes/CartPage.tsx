import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatPriceToman, toPersianDigits } from "@/lib/price";

export function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();

  const items = cart?.items || [];
  const subtotal = cart?.summary?.subtotal ?? 0;
  const shipping = cart?.summary?.shipping ?? 0;
  const total = cart?.summary?.total ?? subtotal + shipping;
  const freeShippingThreshold = 20000000; // 20M Toman
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (items.length === 0) {
    return (
      <div className="bg-stone-50/50 min-h-[60vh] flex items-center justify-center py-20">
        <div className="max-w-md mx-auto px-4 text-center space-y-5">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-900 border border-amber-200">
            <Trash2 className="w-8 h-8 opacity-40" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">سبد خرید شما خالی است</h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            شما هنوز هیچ دست‌سازه‌ای به سبد خرید خود اضافه نکرده‌اید. کاتالوگ آثار چوبی ما را مرور کنید و اثر دلخواهتان را بیابید.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-amber-900 hover:bg-amber-800 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition"
          >
            مشاهده مجموعه آثار
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50/50 min-h-[75vh] pb-20">
      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-stone-500">
            <Link href="/" className="hover:text-amber-900 transition">خانه</Link>
            <span>/</span>
            <span className="text-stone-900 font-medium">سبد خرید</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-serif">سبد خرید دست‌سازه‌ها</h1>
            <p className="text-xs text-stone-500 mt-1">
              شما {toPersianDigits(items.length)} عنوان محصول در سبد خود دارید
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            disabled={loading}
            className="text-xs text-stone-500 hover:text-red-700 transition flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            خالی کردن کل سبد
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items list - 8 cols */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free shipping banner */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="flex items-center gap-2 text-stone-700 font-medium">
                  <Truck className="w-4 h-4 text-amber-800" />
                  {remainingForFreeShipping > 0 ? (
                    <>
                      با افزودن{" "}
                      <strong className="text-amber-900 font-bold">
                        {formatPriceToman(remainingForFreeShipping)}
                      </strong>{" "}
                      دیگر، ارسال سفارش شما رایگان خواهد شد!
                    </>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      ارسال این سفارش برای شما کاملاً رایگان است!
                    </span>
                  )}
                </span>
                <span className="text-xs text-stone-400 font-semibold">{toPersianDigits(freeShippingPercent)}٪</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-900 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${freeShippingPercent}%` }}
                />
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 block"
                  >
                    <img
                      src={item.product.imageUrl || "/images/placeholder.jpg"}
                      alt={item.product.title}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-bold text-stone-900 hover:text-amber-900 transition line-clamp-1 text-base font-serif"
                    >
                      {item.product.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span>گونه چوب: {item.product.woodType || "گردو طبیعی"}</span>
                      {item.product.category && (
                        <>
                          <span>•</span>
                          <span>{item.product.category.name}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#b85d19] pt-1">
                      {formatPriceToman(item.product.price)}
                    </div>
                  </div>

                  {/* Quantity & actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                    <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={loading}
                        aria-label="کاهش تعداد"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-40 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-stone-800">
                        {toPersianDigits(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading || item.quantity >= item.product.stock}
                        aria-label="افزایش تعداد"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-stone-600 disabled:opacity-40 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-left min-w-[90px]">
                      <div className="text-sm font-extrabold text-stone-900 font-serif">
                        {formatPriceToman(item.product.price * item.quantity)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={loading}
                      aria-label="حذف از سبد"
                      className="text-stone-400 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-amber-900"
              >
                <ArrowRight className="w-4 h-4" />
                ادامه خرید و مشاهده سایر آثار
              </Link>
            </div>
          </div>

          {/* Summary sidebar - 4 cols */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5 sticky top-24">
              <h2 className="text-lg font-bold text-stone-900 font-serif border-b border-stone-100 pb-3">
                خلاصه پیش‌فاکتور
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>مجموع ارزش دست‌سازه‌ها:</span>
                  <span className="font-semibold text-stone-900">{formatPriceToman(subtotal)}</span>
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>هزینه بسته‌بندی و ارسال اختصاصی:</span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-emerald-700 font-bold">رایگان</span>
                    ) : (
                      formatPriceToman(shipping)
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline">
                  <span className="font-bold text-stone-900">مبلغ نهایی قابل پرداخت:</span>
                  <span className="text-2xl font-extrabold text-[#b85d19] font-serif">
                    {formatPriceToman(total)}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-amber-900 hover:bg-amber-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-center"
              >
                تکمیل سفارش و تسویه حساب
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="pt-2 text-xs text-stone-500 space-y-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>تضمین اصالت چوب و اتصالات دستی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>بسته‌بندی ایمن چوبی ضد ضربه</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
