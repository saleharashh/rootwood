"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Edit2,
  KeyRound,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Smartphone,
  User,
} from "lucide-react";
import { Dialog } from "@/components/dialog";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  redirect: string;
}

type AuthMode = "otp" | "password" | "signup";
type OtpStep = "send" | "verify";

/** Only same-site paths are honoured, so `?redirect=` cannot be abused. */
function safeRedirect(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AuthDialog({ open, onClose, redirect }: AuthDialogProps) {
  const { signIn, signInWithOtp, requestOtp, signUp, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("otp");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password / Register form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // OTP form states
  const [otpStep, setOtpStep] = useState<OtpStep>("send");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpReceivedCode, setOtpReceivedCode] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleClose = useCallback(() => {
    setMode("otp");
    setOtpStep("send");
    setOtpIdentifier("");
    setOtpCode("");
    setOtpName("");
    setOtpTimer(0);
    setOtpReceivedCode(null);
    setEmail("");
    setPassword("");
    setPasswordConfirmation("");
    setName("");
    setPhone("");
    setError(null);
    setSubmitting(false);
    onClose();
  }, [onClose]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setPassword("");
    setPasswordConfirmation("");
    if (next === "otp") {
      setOtpStep("send");
      setOtpCode("");
    }
  }

  // Handle OTP Send
  async function handleSendOtp(event?: React.FormEvent) {
    if (event) event.preventDefault();
    const target = otpIdentifier.trim();
    if (!target) {
      setError("لطفاً شماره تلفن همراه یا ایمیل خود را وارد کنید");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestOtp(target);
      setOtpReceivedCode(res.code ?? null);
      setOtpTimer(res.expiresInSeconds || 120);
      setOtpStep("verify");
      toast(
        res.code
          ? `کد ورود برای ${target} صادر شد (کد تستی: ${res.code})`
          : `کد ورود برای ${target} ارسال شد`,
        "info",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "ارسال کد با خطا مواجه شد. لطفاً دوباره تلاش کنید.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Handle OTP Verify
  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    const code = otpCode.trim();
    if (!code || code.length < 4) {
      setError("لطفاً کد تأیید دریافت شده را کامل وارد کنید");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signInWithOtp(
        otpIdentifier.trim(),
        code,
        otpName.trim() || undefined,
      );
      toast("ورود موفقیت‌آمیز بود — خوش آمدید", "success");
      handleClose();
      router.replace(safeRedirect(redirect));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "کد تأیید نادرست یا منقضی شده است",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Password Login / Signup
  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (mode === "signup" && password !== passwordConfirmation) {
      setError("تکرار گذرواژه با گذرواژه یکسان نیست");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "password") {
        await signIn(email, password);
        toast("خوش آمدید", "success");
      } else {
        await signUp({ email, password, name, phone: phone || undefined });
        toast("حساب کاربری ساخته شد", "success");
      }
      handleClose();
      router.replace(safeRedirect(redirect));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "مشکلی پیش آمد. دوباره تلاش کنید.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      size="md"
      title={
        <>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-wood)] font-serif text-sm font-bold text-white">
            CR
          </span>
          <span className="truncate">
            {mode === "signup" ? "ساخت حساب کاربری" : "ورود به کرفتدرات"}
          </span>
        </>
      }
    >
      <div className="mb-5 text-center">
        <p className="text-xs text-[var(--color-ink-soft)]">
          {mode === "otp"
            ? "ورود سریع با پیامک یا ایمیل بدون نیاز به به‌خاطرسپاری رمز عبور"
            : mode === "password"
              ? "ورود به حساب با نشانی ایمیل و گذرواژه ثبت‌شده"
              : "با ایجاد حساب، تاریخچه سفارش‌ها و نشانی‌های شما ذخیره می‌شود"}
        </p>
      </div>

      <div
        className="mb-5 flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1 text-xs"
        role="tablist"
        aria-label="ورود یا ساخت حساب"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "otp"}
          onClick={() => switchMode("otp")}
          className={`flex-1 cursor-pointer rounded-lg py-2 font-bold transition-all ${
            mode === "otp"
              ? "bg-white text-[var(--color-wood)] shadow-xs"
              : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          کد یک‌بار مصرف (OTP)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => switchMode("password")}
          className={`flex-1 cursor-pointer rounded-lg py-2 font-bold transition-all ${
            mode === "password"
              ? "bg-white text-[var(--color-wood)] shadow-xs"
              : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          ورود با گذرواژه
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => switchMode("signup")}
          className={`flex-1 cursor-pointer rounded-lg py-2 font-bold transition-all ${
            mode === "signup"
              ? "bg-white text-[var(--color-wood)] shadow-xs"
              : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          ساخت حساب
        </button>
      </div>

      {error && (
        <div
          className="mb-4 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/8 px-4 py-3 text-xs font-medium text-[var(--color-error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ---------------- OTP MODE ---------------- */}
      {mode === "otp" && (
        <div>
          {otpStep === "send" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-otp-identifier"
                  className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                >
                  شماره تلفن همراه یا ایمیل
                </label>
                <div className="relative">
                  <Smartphone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
                  <input
                    id="auth-otp-identifier"
                    type="text"
                    value={otpIdentifier}
                    onChange={(event) => setOtpIdentifier(event.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pe-3 ps-9 text-sm text-[var(--color-ink)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                    placeholder="09121234567 یا user@example.com"
                    dir="ltr"
                    autoFocus
                    required
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--color-ink-mute)]">
                  کد ورود به این شماره یا ایمیل ارسال خواهد شد. در صورت نداشتن حساب، حسابتان خودکار ایجاد می‌شود.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || loading || !otpIdentifier.trim()}
                className="btn btn-primary mt-4 w-full py-3 text-sm font-bold"
              >
                {submitting ? "در حال ارسال کد…" : "دریافت کد تأیید یک‌بار مصرف"}
                <ArrowLeft className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="font-mono text-xs font-bold text-[var(--color-wood)]" dir="ltr">
                    {otpIdentifier}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpStep("send")}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-strong)] hover:underline"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>تغییر</span>
                </button>
              </div>

              <div>
                <label
                  htmlFor="auth-otp-code"
                  className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                >
                  کد ۵ رقمی ارسال‌شده
                </label>
                <div className="relative">
                  <KeyRound className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
                  <input
                    id="auth-otp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white py-3 pe-3 ps-9 text-center font-mono text-xl font-bold tracking-[0.4em] text-[var(--color-wood)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                    placeholder="• • • • •"
                    dir="ltr"
                    autoFocus
                    required
                  />
                </div>
                {otpReceivedCode && (
                  <p className="mt-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-center text-xs font-bold text-emerald-900">
                    کد تستی دریافتی شما: <span className="font-mono text-sm tracking-wider">{otpReceivedCode}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="auth-otp-name"
                  className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
                >
                  نام شما <span className="text-[11px] font-normal text-[var(--color-ink-mute)]">(اختیاری — برای تکمیل پروفایل)</span>
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
                  <input
                    id="auth-otp-name"
                    type="text"
                    value={otpName}
                    onChange={(event) => setOtpName(event.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2 pe-3 ps-9 text-sm text-[var(--color-ink)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                    placeholder="مثلاً: سامی رحیمی"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)] pt-1">
                {otpTimer > 0 ? (
                  <span>ارسال مجدد کد پس از: <strong>{formatTimer(otpTimer)}</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSendOtp()}
                    disabled={submitting}
                    className="flex items-center gap-1 font-bold text-[var(--color-accent-strong)] hover:underline"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>ارسال مجدد کد تأیید</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || loading || otpCode.trim().length < 4}
                className="btn btn-primary mt-4 w-full py-3 text-sm font-bold"
              >
                {submitting ? "در حال بررسی…" : "تأیید و ورود به حساب"}
                <Check className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* ---------------- PASSWORD / SIGNUP MODE ---------------- */}
      {(mode === "password" || mode === "signup") && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
              >
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pe-3 ps-9 text-sm text-[var(--color-ink)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                  placeholder="سامی رحیمی"
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
            >
              نشانی ایمیل
            </label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pe-3 ps-9 text-sm text-[var(--color-ink)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                placeholder="sami@example.com"
                dir="ltr"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
            >
              گذرواژه
            </label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pe-3 ps-9 text-sm text-[var(--color-ink)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                placeholder={
                  mode === "password"
                    ? "گذرواژه خود را وارد کنید"
                    : "حداقل ۸ نویسه"
                }
                dir="ltr"
                autoComplete={mode === "password" ? "current-password" : "new-password"}
                required
                minLength={mode === "signup" ? 8 : 1}
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-password-confirmation"
                className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
              >
                تکرار گذرواژه
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
                <input
                  id="auth-password-confirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pe-3 ps-9 text-sm text-[var(--color-ink)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                  placeholder="گذرواژه را دوباره وارد کنید"
                  dir="ltr"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-phone"
                className="mb-1 block text-xs font-bold text-[var(--color-ink)]"
              >
                شماره تلفن همراه <span className="text-[11px] font-normal text-[var(--color-ink-mute)]">(اختیاری)</span>
              </label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-mute)]" />
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pe-3 ps-9 text-sm text-[var(--color-ink)] shadow-xs outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 placeholder:text-[var(--color-ink-mute)]"
                  placeholder="09120000000"
                  dir="ltr"
                  autoComplete="tel"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            className="btn btn-primary mt-4 w-full py-3 text-sm font-bold"
          >
            {submitting
              ? "در حال پردازش…"
              : mode === "password"
                ? "ورود"
                : "ساخت حساب و ادامه"}
            <ArrowLeft className="h-4 w-4" />
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-[var(--color-ink-soft)]">
        {mode === "otp" ? (
          <>
            می‌خواهید با رمز عبور وارد شوید؟{" "}
            <button
              type="button"
              onClick={() => switchMode("password")}
              className="cursor-pointer font-bold text-[var(--color-accent-strong)] hover:underline"
            >
              ورود با گذرواژه
            </button>
          </>
        ) : mode === "password" ? (
          <>
            حساب کاربری ندارید؟{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="cursor-pointer font-bold text-[var(--color-accent-strong)] hover:underline"
            >
              ساخت حساب جدید
            </button>
            {" یا "}
            <button
              type="button"
              onClick={() => switchMode("otp")}
              className="cursor-pointer font-bold text-[var(--color-accent-strong)] hover:underline"
            >
              ورود سریع با پیامک
            </button>
          </>
        ) : (
          <>
            از قبل حساب دارید؟{" "}
            <button
              type="button"
              onClick={() => switchMode("otp")}
              className="cursor-pointer font-bold text-[var(--color-accent-strong)] hover:underline"
            >
              ورود به حساب
            </button>
          </>
        )}
      </p>
    </Dialog>
  );
}
