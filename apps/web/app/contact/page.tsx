"use client";

import { useState } from "react";
import { useToast } from "@/components/toast-provider";
import { submitContact } from "@/lib/api";
import { ArrowLeft, Mail, Phone, MapPin, Clock, ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "تحویل و ساخت سفارش چقدر زمان می‌برد؟",
    answer:
      "قطعه‌های سفارشی معمولاً بین ۳ تا ۵ هفته زمان ساخت نیاز دارند تا چوب استراحت کند و لایه‌های روغن به خوبی خشک شوند. کالاهای آماده کارگاه طی ۳ تا ۵ روز کاری بسته‌بندی و ارسال می‌شوند.",
  },
  {
    question: "ارسال به چه مناطقی انجام می‌شود؟",
    answer:
      "ارسال به تمامی استان‌ها و شهرهای کشور توسط ناوگان تخصصی حمل مبلمان انجام می‌پذیرد. برای خارج از کشور نیز پیش از سفارش با ما مکاتبه نمایید.",
  },
  {
    question: "چگونه از مبلمان روغن‌خورده طبیعی مراقبت کنیم؟",
    answer:
      "مبلمان را از حرارت مستقیم و ماندگاری طولانی آب دور نگه دارید. سالی یک بار با پارچه نرم و روغن‌موم گیاهی کارگاه، سطح را تغذیه کنید تا شفافیت و مقاومت چوب حفظ شود.",
  },
  {
    question: "آیا امکان سفارش در ابعاد یا گونه چوب اختصاصی وجود دارد؟",
    answer:
      "بله، عمده قطعه‌های کارگاه کرفتدرات متناسب با ابعاد و پلان خانه شما قابل سفارشی‌سازی هستند. کافیست از فرم زیر ابعاد دلخواه را برای ما ارسال کنید.",
  },
  {
    question: "ضمانت و رویه بازگشت کالا چگونه است؟",
    answer:
      "تمام اتصالات چوبی شامل ضمانت ۱۲ ماهه کارگاه هستند. در صورت هرگونه آسیب در طول حمل، قطعه بدون کوچک‌ترین هزینه برای شما بازسازی یا جایگزین می‌شود.",
  },
  {
    question: "سفارشم را چگونه پیگیری کنم؟",
    answer:
      "در هر مرحله از برش، پرداخت و بسته‌بندی، وضعیت در داشبورد کاربری شما به‌روزرسانی شده و پیامک و ایمیل اطلاع‌رسانی برایتان ارسال می‌گردد.",
  },
];

export default function ContactPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"contact" | "faq">("contact");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "نام و نام خانوادگی الزامی است";
    if (!form.email.trim()) errs.email = "نشانی ایمیل الزامی است";
    if (!form.subject.trim()) errs.subject = "موضوع پیام الزامی است";
    if (!form.message.trim()) errs.message = "متن پیام الزامی است";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitContact({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        subject: form.subject,
        message: form.message,
      });
      toast("پیام با موفقیت ارسال شد — تیم کارگاه به‌زودی با شما تماس می‌گیرد", "success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast("ارسال پیام ممکن نشد. لطفاً دوباره تلاش کنید.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Header */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white px-6 py-10 sm:px-12 sm:py-14 shadow-xs">
          <div className="relative max-w-2xl space-y-3">
            <span className="inline-block rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)]">
              همراه شما در انتخاب
            </span>
            <h1 className="text-3xl font-bold text-[var(--color-wood)] sm:text-4xl lg:text-5xl tracking-tight">
              گفت‌وگو درباره خانه و چوب
            </h1>
            <p className="text-base leading-relaxed text-[var(--color-ink-soft)]">
              پرسشی درباره انتخاب نوع چوب، پرداخت با روغن طبیعی، تناسب ابعاد یا استعلام زمان ساخت سفارشی دارید؟ مشتاقانه آماده شنیدن نظرات شما هستیم.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
                <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                پاسخگویی: شنبه تا پنجشنبه، ۹ تا ۱۸
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
                <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                کارگاه و استودیو کرفتدرات، شیراز
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Contact info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-xs">
              <h2 className="mb-5 text-base font-bold text-[var(--color-wood)] border-b border-[var(--color-border)] pb-3">
                اطلاعات تماس مستقیم
              </h2>
              <div className="space-y-3">
                {[
                  {
                    icon: <MapPin className="h-4 w-4" />,
                    label: "نشانی کارگاه",
                    value: "کوچه خشت، محله قدیم، شیراز",
                  },
                  {
                    icon: <Mail className="h-4 w-4" />,
                    label: "ایمیل رسمی",
                    value: "hello@craftedroot.com",
                  },
                  {
                    icon: <Phone className="h-4 w-4" />,
                    label: "شماره کارگاه",
                    value: "+98 912 000 0000",
                  },
                  {
                    icon: <Clock className="h-4 w-4" />,
                    label: "ساعت کاری",
                    value: "شنبه تا پنجشنبه، ۹ تا ۱۸",
                  },
                ].map((contact) => (
                  <div
                    key={contact.label}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--color-accent)] border border-[var(--color-border)]">
                      {contact.icon}
                    </div>
                    <dl className="min-w-0">
                      <dt className="text-xs font-bold text-[var(--color-ink)]">
                        {contact.label}
                      </dt>
                      <dd
                        className="text-xs text-[var(--color-ink-soft)] mt-0.5"
                        dir={contact.label === "ایمیل رسمی" || contact.label === "شماره کارگاه" ? "ltr" : undefined}
                      >
                        {contact.value}
                      </dd>
                    </dl>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6">
              <h2 className="mb-3 text-sm font-bold text-[var(--color-wood)]">
                نکاتی برای ثبت دقیق‌تر درخواست
              </h2>
              <ul className="space-y-2.5 text-xs text-[var(--color-ink-soft)]">
                {[
                  "ابعاد فضای مورد نظر و کاربری مد نظرتان را به اختصار بیان کنید.",
                  "در صورت نیاز به هماهنگی با مبلمان موجود، نوع یا رنگ چوب فعلی را ذکر فرمایید.",
                  "برای طراحی‌های کاملاً سفارشی، امکان ارائه طرح دو‌بعدی اولیه فراهم است.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
                    />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xs"
            >
              <h2 className="text-base font-bold text-[var(--color-wood)] border-b border-[var(--color-border)] pb-3">
                فرم ارسال پیام به کارگاه
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                  >
                    نام و نام خانوادگی
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className={`glass-input w-full rounded-xl px-3.5 py-2.5 text-sm outline-none ${
                      errors.name ? "glass-input-error" : ""
                    }`}
                    placeholder="نام کامل شما"
                    autoComplete="name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-[var(--color-error)]">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                  >
                    نشانی ایمیل
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className={`glass-input w-full rounded-xl px-3.5 py-2.5 text-sm outline-none ${
                      errors.email ? "glass-input-error" : ""
                    }`}
                    placeholder="email@example.com"
                    dir="ltr"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-[var(--color-error)]">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                  >
                    شماره تلفن همراه <span className="text-[11px] font-normal text-[var(--color-ink-mute)]">(اختیاری)</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="glass-input w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                    placeholder="09120000000"
                    dir="ltr"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                  >
                    موضوع درخواست
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subject: e.target.value }))
                    }
                    className={`glass-input w-full rounded-xl px-3.5 py-2.5 text-sm outline-none ${
                      errors.subject ? "glass-input-error" : ""
                    }`}
                    placeholder="مثلاً: سفارش میز ناهارخوری سفارشی ۸ نفره"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-xs text-[var(--color-error)]">{errors.subject}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="contact-message"
                    className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                  >
                    متن پیام
                  </label>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    rows={5}
                    className={`glass-input w-full resize-y rounded-xl px-3.5 py-2.5 text-sm outline-none ${
                      errors.message ? "glass-input-error" : ""
                    }`}
                    placeholder="توضیحات مورد نظرتان را به دقت بنویسید…"
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-[var(--color-error)]">{errors.message}</p>
                  )}
                </div>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary px-6 py-2.5 text-sm font-bold"
                >
                  {submitting ? "در حال ثبت پیام…" : "ارسال پیام به کارگاه"}
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <p className="text-xs text-[var(--color-ink-mute)]">
                  پاسخ ظرف ۲۴ ساعت کاری ارسال می‌گردد.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-12 rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
            <h2 className="text-base font-bold text-[var(--color-wood)]">
              پرسش‌های متداول مشتریان
            </h2>
            <button
              type="button"
              onClick={() => setMode(mode === "faq" ? "contact" : "faq")}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-stone-200"
            >
              {mode === "faq" ? "بستن تمام موارد" : "نمایش تمام پاسخ‌ها"}
            </button>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                open={mode === "faq"}
                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3.5 transition-all"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[var(--color-ink)] [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-ink-mute)] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[var(--color-ink-soft)] border-t border-[var(--color-border)] pt-2.5">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
