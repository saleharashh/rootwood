import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Sparkles,
  Layers,
  Trees,
  Phone,
  ArrowLeft,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { api, type Order } from "@/lib/api";
import { formatPriceToman, toPersianDigits, formatJalaliDate } from "@/lib/price";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  { key: "PENDING", label: "ثبت اولیه سفارش", desc: "در انتظار پرداخت یا تأیید نهایی کارگاه" },
  { key: "PAID", label: "تأیید پرداخت و نوبت کارگاه", desc: "انتخاب الوار و ورود به برنامه نجاری" },
  { key: "PROCESSING", label: "در حال ساخت و اتصالات", desc: "برش اسلب، اتصالات دم‌چلچله‌ای و پرداخت ارگانیک" },
  { key: "SHIPPED", label: "بسته‌بندی پالت و ارسال", desc: "تحویل به باربری اختصاصی مبلمان با ضربه‌گیر" },
  { key: "DELIVERED", label: "تحویل نهایی به مشتری", desc: "تحویل کامل همراه با شناسنامه اصالت چوب" },
];

function getStageIndex(status: string): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "PAID":
      return 1;
    case "PROCESSING":
      return 2;
    case "SHIPPED":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return 1;
  }
}

export function TrackOrder() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qCode = params.get("code") || params.get("id") || params.get("orderNumber");
    if (qCode) {
      setCode(qCode);
      handleTrack(qCode);
    }
  }, []);

  const handleTrack = async (searchCode?: string) => {
    const queryCode = (searchCode || code).trim();
    if (!queryCode) {
      setErrorMsg("لطفاً کد سفارش خود را وارد فرمایید");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSearched(true);

    try {
      const res = await api.trackOrder(queryCode, phone.trim() || undefined);
      setOrder(res.order);
    } catch (err: unknown) {
      setOrder(null);
      setErrorMsg(err instanceof Error ? err.message : "سفارشی با این مشخصات یافت نشد");
    } finally {
      setLoading(false);
    }
  };

  const currentStage = order ? getStageIndex(order.status) : 0;
  const isCancelled = order?.status === "CANCELLED";

  return (
    <div className="bg-[#faf8f5] min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="gold" className="px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 text-[#b85d19]" />
            <span>سامانه پیگیری ساخت و ارسال آثار چوبی</span>
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-[#2b1e17]">
            پیگیری وضعیت سفارش و فرآیند خلق اثر
          </h1>
          <p className="text-xs sm:text-sm text-[#655347] max-w-lg mx-auto leading-relaxed">
            با وارد کردن کد پیگیری یا شناسه سفارش، می‌توانید از مرحله انتخاب چوب در کارگاه تا بسته‌بندی پالت و ارسال را به صورت زنده دنبال کنید.
          </p>
        </div>

        {/* Search Card (60% White / 30% Border / 10% Button) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e8ded3] shadow-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-7">
              <label className="text-xs font-semibold text-[#655347] block mb-1.5">
                کد یا شناسه سفارش *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: CR-XXXXXX یا شناسه ۱۰ رقمی"
                  className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-[#e8ded3] bg-[#faf8f5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b85d19]/40 font-mono"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-[#655347] block mb-1.5">
                شماره همراه (اختیاری)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912..."
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-[#e8ded3] bg-[#faf8f5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b85d19]/40 font-mono"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11.5 text-xs sm:text-sm gap-2 font-bold shadow-xs bg-[#b85d19] hover:bg-[#9e4e13]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>پیگیری</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Order Details & Stepper */}
        {order && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Status Summary Banner */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#e8ded3] shadow-card space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e7dd] pb-5">
                <div className="space-y-1">
                  <span className="text-xs text-[#8c796e]">شناسه سفارش:</span>
                  <div className="text-lg font-mono font-bold text-[#2b1e17]">{order.orderNumber || order.id}</div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-[#655347]">
                    <Calendar className="w-4 h-4 text-[#8c796e]" />
                    <span>{formatJalaliDate(order.createdAt)}</span>
                  </div>
                  <Badge variant={isCancelled ? "destructive" : "gold"} className="text-xs px-3 py-1">
                    {order.status === "PAID"
                      ? "تأیید پرداخت (در نوبت کارگاه)"
                      : order.status === "PROCESSING"
                      ? "در حال نجاری و فینیش"
                      : order.status === "SHIPPED"
                      ? "تحویل به باربری (در مسیر)"
                      : order.status === "DELIVERED"
                      ? "تحویل شده به مشتری"
                      : order.status === "CANCELLED"
                      ? "لغو شده"
                      : "در انتظار پرداخت"}
                  </Badge>
                </div>
              </div>

              {/* Craftsmanship & Delivery Stepper */}
              {!isCancelled ? (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold text-[#2b1e17] font-serif flex items-center gap-2">
                    <Trees className="w-4 h-4 text-[#b85d19]" />
                    <span>مراحل آماده‌سازی و ارسال دست‌سازه:</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                    {STAGES.map((st, idx) => {
                      const isDone = idx < currentStage;
                      const isCurrent = idx === currentStage;

                      return (
                        <div
                          key={st.key}
                          className={`p-4 rounded-2xl border transition-all text-right space-y-2 ${
                            isCurrent
                              ? "bg-[#fdf1e7] border-[#b85d19] ring-1 ring-[#b85d19]/30 shadow-xs"
                              : isDone
                              ? "bg-white border-[#e8ded3]"
                              : "bg-[#faf8f5]/60 border-[#f0e7dd] opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isDone
                                  ? "bg-emerald-700 text-white"
                                  : isCurrent
                                  ? "bg-[#b85d19] text-white"
                                  : "bg-[#e8ded3] text-[#655347]"
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : toPersianDigits(idx + 1)}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-[#b85d19] bg-white px-2 py-0.5 rounded-full border border-[#edd1bc]">
                                در این مرحله
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-[#2b1e17] leading-tight font-serif">
                            {st.label}
                          </div>
                          <div className="text-[11px] text-[#655347] leading-relaxed line-clamp-2">
                            {st.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed">
                  این سفارش لغو گردیده و قطعه چوب مربوطه به انبار مواد اولیه بازگردانده شده است.
                </div>
              )}

              {/* Items in this Order */}
              <div className="pt-4 border-t border-[#f0e7dd] space-y-3">
                <h4 className="text-xs font-bold text-[#655347] uppercase tracking-wider">
                  آثار چوبی موجود در این سفارش
                </h4>

                <div className="divide-y divide-[#f0e7dd]">
                  {order.items?.map((it) => (
                    <div key={it.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#f4ece4] border border-[#e8ded3] overflow-hidden shrink-0">
                          <img
                            src={it.product?.images?.[0]?.url || "/images/workshop.webp"}
                            alt={it.productTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#2b1e17]">{it.productTitle}</div>
                          <div className="text-[11px] text-[#8c796e]">
                            تعداد: {toPersianDigits(it.quantity)} عدد
                          </div>
                        </div>
                      </div>

                      <div className="font-bold text-[#b85d19] font-serif">
                        {formatPriceToman(it.unitPrice * it.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#f0e7dd] flex justify-between items-baseline font-serif">
                  <span className="text-xs font-bold text-[#655347]">مبلغ کل پرداخت‌شده:</span>
                  <span className="text-lg font-black text-[#b85d19]">
                    {formatPriceToman(order.totalAmount || order.total || 0)}
                  </span>
                </div>
              </div>

              {/* Delivery and Cargo Notice */}
              <div className="p-4 bg-[#f4ece4] rounded-2xl border border-[#e8ded3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#655347]">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-[#b85d19] shrink-0" />
                  <span>
                    مقصد ارسال: <strong>{order.city}</strong> ({order.street})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#b85d19] font-medium shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                  <span>پشتیبانی کارگاه: 021-88776655</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help box */}
        {!order && !loading && (
          <div className="p-6 rounded-3xl border border-[#e8ded3] bg-[#f4ece4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#655347]">
            <div className="flex items-center gap-3 text-right">
              <Package className="w-6 h-6 text-[#b85d19] shrink-0" />
              <div>
                <strong className="text-[#2b1e17] block font-serif text-sm">کد سفارش خود را فراموش کرده‌اید؟</strong>
                <span>اگر با حساب کاربری خرید کرده‌اید، می‌توانید مستقیماً از بخش حساب کاربری به سفارش‌های خود دسترسی داشته باشید.</span>
              </div>
            </div>
            <Link href="/account">
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                <span>ورود به حساب کاربری</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
