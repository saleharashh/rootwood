import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw, PackageCheck } from "lucide-react";
import { api, type Order } from "@/lib/api";
import { formatPriceToman, toPersianDigits, formatJalaliDate } from "@/lib/price";
import { useCart } from "@/components/cart-provider";

export function CheckoutCallback() {
  const { refreshCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [refId, setRefId] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      const searchParams = new URLSearchParams(window.location.search);
      const authority = searchParams.get("Authority") || searchParams.get("authority") || "";
      const trackId = searchParams.get("trackId") || "";
      const bankSuccess = searchParams.get("success");
      const status =
        searchParams.get("Status") ||
        searchParams.get("status") ||
        (bankSuccess === "1" ? "OK" : bankSuccess === "0" ? "NOK" : "");
      const orderId = searchParams.get("orderId") || "";
      const gateway = searchParams.get("gateway") || "";

      try {
        const res = await api.verifyPayment({
          orderId: orderId || undefined,
          authority: authority || undefined,
          trackId: trackId || undefined,
          status: status || undefined,
          gateway: gateway || undefined,
        });

        if (isMounted) {
          if (res.verified) {
            setSuccess(true);
            setMessage(res.message || "تراکنش بانکی شما با موفقیت تأیید شد.");
            setRefId(res.refId || res.trackId || authority || "SHP-" + Math.floor(Math.random() * 900000 + 100000));
            setOrder(res.order || null);
            refreshCart();
          } else {
            setSuccess(false);
            setMessage(res.message || "تأیید پرداخت ناموفق بود.");
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setSuccess(false);
          setMessage(err instanceof Error ? err.message : "خطا در برقراری ارتباط با درگاه بانکی");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50/50">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-stone-900 font-serif">در حال اعتبارسنجی تراکنش بانکی با شاپرک...</h2>
          <p className="text-xs text-stone-500">لطفاً تا دریافت پاسخ نهایی از بستن صفحه خودداری فرمایید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50/50 min-h-[75vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 text-center space-y-6">
        {success ? (
          <>
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-stone-900 font-serif">پرداخت با موفقیت انجام شد</h1>
              <p className="text-xs sm:text-sm text-stone-600">
                سفارش شما در سیستم کارگاه روت‌وود ثبت گردید و جهت آماده‌سازی در صف تولید قرار گرفت.
              </p>
            </div>

            {/* Receipt card */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 text-xs sm:text-sm space-y-3">
              <div className="flex justify-between items-center text-stone-600">
                <span>شماره پیگیری پرداخت:</span>
                <span className="font-mono font-bold text-stone-900" dir="ltr">
                  {refId}
                </span>
              </div>
              {order && (
                <>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>شناسه سفارش:</span>
                    <span className="font-mono text-stone-900" dir="ltr">
                      {order.id.slice(0, 13)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>مبلغ پرداخت‌شده:</span>
                    <span className="font-bold text-[#b85d19] font-serif">
                      {formatPriceToman(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>تاریخ پرداخت:</span>
                    <span className="text-stone-800">{formatJalaliDate(order.paidAt || order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>تحویل‌گیرنده:</span>
                    <span className="text-stone-800">{order.recipientName} ({toPersianDigits(order.phone)})</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={order ? `/track?code=${order.orderNumber || order.id}` : "/account"}
                className="flex-1 bg-[#b85d19] hover:bg-[#9e4e13] text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-4 h-4" />
                پیگیری زنده سفارش و مراحل ساخت
              </Link>
              <Link
                href="/"
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 px-5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                صفحه اصلی
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-2 border-red-100 shadow-sm">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold text-stone-900 font-serif">پرداخت ناموفق بود</h1>
              <p className="text-xs sm:text-sm text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
                {message || "تراکنش توسط درگاه شاپرک تایید نشد یا توسط کاربر لغو گردید."}
              </p>
              <p className="text-xs text-stone-500 pt-2">
                در صورتی که مبلغی از حساب شما کسر شده است، ظرف حداکثر ۷۲ ساعت آینده توسط شبکه شاپرک بازگردانده می‌شود.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/checkout"
                className="flex-1 bg-[#b85d19] hover:bg-[#9e4e13] text-white font-semibold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                تلاش مجدد برای پرداخت
              </Link>
              <Link
                href="/cart"
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 px-5 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                بازگشت به سبد
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
