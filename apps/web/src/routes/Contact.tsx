import { useState } from "react";
import { Link } from "wouter";
import { Clock, Mail, MapPin, MessageSquare, Phone, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast-provider";

export function Contact() {
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("bespoke");
  const [woodPref, setWoodPref] = useState("گردو سیاه طبیعی");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast("لطفاً نام، ایمیل و متن پیام خود را وارد نمایید", "error");
      return;
    }

    setSubmitting(true);
    try {
      const fullSubject = inquiryType === "bespoke"
        ? `[سفارش ساخت اختصاصی - ${woodPref}] ${subject.trim() || "درخواست جدید"}`
        : subject.trim() || "پیام از فرم تماس با ما";

      await api.submitContact({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: fullSubject,
        message: message.trim(),
      });

      setSubmitted(true);
      showToast("پیام شما با موفقیت ثبت شد. به‌زودی با شما تماس خواهیم گرفت.", "success");
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "خطا در ارسال پیام", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-stone-50/50 pb-24">
      {/* Header */}
      <div className="bg-stone-900 text-stone-100 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
            ارتباط مستقیم با کارگاه و آتلیه
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif">
            مشاوره، سفارشی‌سازی و سفارش ساخت اختصاصی
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            مشتاقانه آماده شنیدن ایده‌های شما، پاسخ به پرسش‌ها درباره نگهداری چوب یا ساخت اثری منحصر‌به‌فرد برای فضای زندگی و کار شما هستیم.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Details - 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-stone-900 font-serif border-b border-stone-100 pb-3">
                اطلاعات کارگاه و آدرس
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">نشانی آتلیه و شوروم:</h3>
                    <p className="text-stone-600 leading-relaxed mt-0.5">
                      تهران، خیابان ولیعصر، بالاتر از پارک ساعی، بن‌بست نسترن، پلاک ۱۲، استودیو روت‌وود
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">تلفن مستقیم کارگاه:</h3>
                    <p className="text-stone-600 mt-0.5" dir="ltr">
                      021 - 8877 6655
                    </p>
                    <p className="text-stone-600" dir="ltr">
                      0912 - 345 6789 (پشتیبانی و واتس‌اپ)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">پست الکترونیک:</h3>
                    <p className="text-stone-600 mt-0.5" dir="ltr">
                      hello@craftedroot.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">ساعات حضور و بازدید با هماهنگی:</h3>
                    <p className="text-stone-600 mt-0.5">
                      شنبه تا پنج‌شنبه: ۹:۰۰ الی ۱۸:۰۰
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#78401d] via-[#8c4f27] to-[#633316] text-[#fcfaf7] p-6 sm:p-8 rounded-3xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-amber-200 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>فرآیند سفارش اختصاصی</span>
              </div>
              <p className="text-xs text-[#fbf4ec]/90 leading-relaxed">
                پس از ثبت فرم، استادکاران ما ظرف ۲۴ ساعت برای گفتگو پیرامون طرح، متریال، ابعاد دقیق و ارائه پیش‌طرح سه‌بعدی و برآورد زمان ساخت با شما تماس خواهند گرفت.
              </p>
            </div>
          </div>

          {/* Form - 7 cols */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-stone-900 font-serif border-b border-stone-100 pb-3">
              فرم ارسال پیام و سفارش سفارشی
            </h2>

            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 font-serif">پیام شما با موفقیت دریافت شد</h3>
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                  تیم کارگاه روت‌وود پیام شما را بررسی کرده و در کوتاه‌ترین زمان ممکن از طریق تماس یا ایمیل با شما در تماس خواهد بود.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs font-semibold text-amber-900 underline"
                >
                  ارسال پیام یا سفارش دیگر
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Inquiry type radio */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-2">نوع درخواست شما:</label>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        inquiryType === "bespoke"
                          ? "border-[#8c4f27] bg-[#f8ede2] ring-1 ring-[#8c4f27] font-bold text-[#8c4f27]"
                          : "border-stone-200 text-stone-700 hover:bg-[#f8ede2]/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="inquiryType"
                        value="bespoke"
                        checked={inquiryType === "bespoke"}
                        onChange={() => setInquiryType("bespoke")}
                        className="text-[#8c4f27]"
                      />
                      <span>سفارش ساخت اختصاصی</span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                        inquiryType === "general"
                          ? "border-[#8c4f27] bg-[#f8ede2] ring-1 ring-[#8c4f27] font-bold text-[#8c4f27]"
                          : "border-stone-200 text-stone-700 hover:bg-[#f8ede2]/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="inquiryType"
                        value="general"
                        checked={inquiryType === "general"}
                        onChange={() => setInquiryType("general")}
                        className="text-amber-900"
                      />
                      <span>تماس و پرسش عمومی</span>
                    </label>
                  </div>
                </div>

                {inquiryType === "bespoke" && (
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      گونه چوب مد نظر شما برای ساخت:
                    </label>
                    <select
                      value={woodPref}
                      onChange={(e) => setWoodPref(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900 bg-white"
                    >
                      <option value="گردو سیاه طبیعی">چوب گردو سیاه کوهستان (تیره‌رنگ با رگه‌های موج‌دار)</option>
                      <option value="راش گرجستان">چوب راش طبیعی (کرم‌رنگ با بافت ریز و مقاوم)</option>
                      <option value="بلوط جنگلی">چوب بلوط کهنسال (نقش‌های درشت و مقاومت حداکثری)</option>
                      <option value="چنار ریشه‌دار">چوب چنار خالدار سنتی (طرح‌های ابری و سبک اصیل)</option>
                      <option value="مشاوره کارگاه">نیاز به پیشنهاد استادکار کارگاه دارم</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">نام و نام خانوادگی *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="مثال: مریم کریمی"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">پست الکترونیک (ایمیل) *</label>
                    <input
                      type="email"
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900 text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">شماره تماس (جهت مشاوره تلفنی)</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09123456789"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900 text-right"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">موضوع پیام</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: میز ناهارخوری ۶ نفره اسلب گردو"
                      className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    شرح جزئیات، ابعاد تقریبی یا متن پیام *
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="ابعاد، نوع فینیش یا هر توضیحی که به ما در درک بهتر سفارش شما کمک می‌کند..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-900"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-amber-900 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold px-8 py-3 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>در حال ارسال پیام...</span>
                      </>
                    ) : (
                      <>
                        <span>ارسال پیام به آتلیه</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
