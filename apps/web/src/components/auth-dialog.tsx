import React, { useState, useEffect } from "react";
import { X, Phone, User, Mail, CheckCircle2, ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useToast } from "./toast-provider";
import { isPlaceholderUserName, normalizeIranianPhone, toEnglishDigits } from "@/lib/validation";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { sendOtp, verifyOtp, adminLogin, updateProfile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"phone" | "verify" | "profile" | "admin">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  // Post-login profile completion state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setOtpCode("");
      setAdminPassword("");
      setCountdown(0);
      setFullName("");
      setEmail("");
    }
  }, [open]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  if (!open) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validPhone = normalizeIranianPhone(phoneInput);
    if (!validPhone) {
      toast("لطفاً شماره موبایل معتبر ایرانی (مانند 09123456789) وارد نمایید", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(validPhone);
      setNormalizedPhone(validPhone);
      setStep("verify");
      setCountdown(res.expiresInSeconds || 120);
      toast(res.message || "کد تأیید پیامک شد", "info");
      if (res.code) {
        setOtpCode(res.code);
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "خطا در ارسال کد تأیید", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = toEnglishDigits(otpCode).replace(/\D/g, "");
    if (cleanCode.length < 4) {
      toast("لطفاً کد تأیید پیامک‌شده را کامل وارد نمایید", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(normalizedPhone, cleanCode);
      if (!res.profileComplete) {
        setStep("profile");
      } else {
        onClose();
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "کد تأیید نادرست یا منقضی است", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPhone = normalizeIranianPhone(phoneInput);
    if (!validPhone) {
      toast("لطفاً شماره موبایل معتبر ایرانی (مانند 09123456789) وارد نمایید", "error");
      return;
    }
    if (!adminPassword) {
      toast("رمز عبور مدیر را وارد نمایید", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(validPhone, adminPassword);
      setNormalizedPhone(validPhone);
      if (!res.profileComplete) {
        setStep("profile");
      } else {
        onClose();
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "ورود مدیر ناموفق بود", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (cleanName.length < 2 || isPlaceholderUserName(cleanName)) {
      toast("لطفاً نام و نام خانوادگی واقعی خود را وارد نمایید", "error");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(cleanName, email.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "خطا در ثبت اطلاعات کاربری", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-label="ورود با شماره موبایل"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--color-border)] animate-in fade-in zoom-in-95"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-[var(--color-ink-mute)] hover:bg-[var(--color-surface-2)]"
          aria-label="بستن پنجره ورود"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="inline-block rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-bold text-[var(--color-accent-strong)] mb-2">
            کارگاه روت‌وود گروپ
          </span>
          <h2 className="text-2xl font-bold text-[var(--color-wood)] font-serif">
            {step === "phone"
              ? "ورود یا عضویت با شماره موبایل"
              : step === "admin"
              ? "ورود مدیر آتلیه"
              : step === "verify"
              ? "تأیید شماره موبایل"
              : "تکمیل مشخصات کاربری"}
          </h2>
          <p className="text-xs text-[var(--color-ink-mute)] mt-1.5">
            {step === "phone"
              ? "برای ورود یا ساخت حساب کاربری، فقط شماره موبایل خود را وارد کنید."
              : step === "admin"
              ? "ورود موقت مدیران با شماره مجاز و رمز عبور، تا زمان اتصال پنل پیامکی."
              : step === "verify"
              ? `کد ۶ رقمی ارسال‌شده به شماره ${normalizedPhone} را وارد نمایید.`
              : "برای ثبت سفارش سریع‌تر و صدور شناسنامه چوب، نام خود را ثبت نمایید."}
          </p>
        </div>

        {/* Step 1: Enter Mobile Phone Only */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                شماره موبایل *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="09123456789"
                  dir="ltr"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden font-mono text-left"
                />
                <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--color-ink-mute)]">
                کد تأیید یک‌بار مصرف برای شما پیامک خواهد شد و پس از ورود می‌توانید سایر اطلاعات را تکمیل کنید.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm mt-2 font-bold"
            >
              {loading ? "در حال ارسال کد..." : "دریافت کد تأیید پیامکی"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminPassword("");
                setStep("admin");
              }}
              className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>ورود مدیران با رمز عبور</span>
            </button>
          </form>
        )}

        {/* Step 1.1: Temporary Admin Password Login */}
        {step === "admin" && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                شماره موبایل مدیر *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  autoFocus
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="09123456789"
                  dir="ltr"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden font-mono text-left"
                />
                <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                رمز عبور مدیر *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  dir="ltr"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden font-mono text-left"
                />
                <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] leading-relaxed text-amber-800">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>این ورود موقت است و فقط برای شماره‌های مجاز مدیر کار می‌کند؛ پس از اتصال پنل پیامکی می‌توانید آن را غیرفعال کنید.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm font-bold"
            >
              {loading ? "در حال ورود..." : "ورود به پنل مدیریت"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminPassword("");
                setStep("phone");
              }}
              className="flex w-full items-center justify-center gap-1 py-1 text-xs font-medium text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>بازگشت به ورود با کد پیامکی</span>
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP Code */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(toEnglishDigits(e.target.value).replace(/\D/g, ""))}
                placeholder="------"
                dir="ltr"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-[var(--color-border)] py-3 bg-white focus:border-[var(--color-accent)] focus:outline-hidden font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--color-ink-mute)]">
              {countdown > 0 ? (
                <span>ارسال مجدد تا {countdown} ثانیه دیگر</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="text-[var(--color-accent)] hover:underline font-bold"
                >
                  ارسال مجدد کد
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtpCode("");
                }}
                className="text-[var(--color-ink-soft)] hover:underline flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>تغییر شماره</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 4}
              className="btn btn-primary w-full py-3 text-sm font-bold"
            >
              {loading ? "در حال بررسی..." : "تأیید و ورود"}
            </button>
          </form>
        )}

        {/* Step 3: Post-Login Profile Registration */}
        {step === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ورود با شماره {normalizedPhone} انجام شد؛ لطفاً مشخصات خود را تکمیل کنید.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                نام و نام خانوادگی *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: سهراب سپهری"
                  className="w-full rounded-xl border border-[var(--color-border)] pr-10 pl-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
                />
                <User className="absolute right-3.5 top-3 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                ایمیل (اختیاری)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full rounded-xl border border-[var(--color-border)] pl-10 pr-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden text-left"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-sm font-bold"
              >
                {loading ? "در حال ذخیره..." : "ثبت اطلاعات و ادامه"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-medium text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] transition"
              >
                تکمیل در زمان دیگر (قبل از ثبت سفارش تکمیل خواهد شد)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
