import React, { useState, useEffect } from "react";
import { X, Lock, Mail, Phone, User, KeyRound, ArrowRight } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useToast } from "./toast-provider";

interface AuthDialogProps {
  open: boolean;
  mode: "signin" | "signup" | "otp";
  setMode: (m: "signin" | "signup" | "otp") => void;
  onClose: () => void;
}

export function AuthDialog({ open, mode, setMode, onClose }: AuthDialogProps) {
  const { loginWithPassword, registerWithPassword, sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!open) return null;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithPassword(email, password);
      onClose();
    } catch (err: any) {
      toast(err.message || "خطا در ورود به حساب کاربری", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerWithPassword(name, email, password, phone);
      onClose();
    } catch (err: any) {
      toast(err.message || "خطا در ثبت نام", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendOtp(otpIdentifier);
      setOtpStep("verify");
      setCountdown(res.expiresInSeconds || 120);
      toast(res.message || "کد تأیید ارسال شد", "info");
      if (res.code) {
        // Dev echo
        setOtpCode(res.code);
      }
    } catch (err: any) {
      toast(err.message || "خطا در ارسال کد", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(otpIdentifier, otpCode);
      onClose();
    } catch (err: any) {
      toast(err.message || "کد تأیید نادرست است", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-label="ورود به حساب کاربری"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--color-border)] animate-in fade-in zoom-in-95"
      >
        <button
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
          <h2 className="text-2xl font-bold text-[var(--color-wood)]">
            {mode === "signin"
              ? "ورود به حساب کاربری"
              : mode === "signup"
              ? "ساخت حساب کاربری جدید"
              : "ورود با رمز یک‌بار مصرف"}
          </h2>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-xl bg-[var(--color-surface-2)] p-1 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "signin"
                ? "bg-white text-[var(--color-wood)] shadow-xs"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            ورود با رمز
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setOtpStep("request");
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "otp"
                ? "bg-white text-[var(--color-wood)] shadow-xs"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            ورود سریع با پیامک
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === "signup"
                ? "bg-white text-[var(--color-wood)] shadow-xs"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            ثبت‌نام
          </button>
        </div>

        {/* 1. Password Login */}
        {mode === "signin" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                ایمیل
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
                />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
                />
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm mt-2 font-bold"
            >
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </form>
        )}

        {/* 2. OTP Login */}
        {mode === "otp" && (
          <div>
            {otpStep === "request" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                    شماره موبایل یا ایمیل
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={otpIdentifier}
                      onChange={(e) => setOtpIdentifier(e.target.value)}
                      placeholder="09123456789 یا email@domain.com"
                      dir="ltr"
                      className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
                    />
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-[var(--color-ink-mute)] pointer-events-none" />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-ink-mute)]">
                    کد یک‌بار مصرف ۶ رقمی برای شما پیامک یا ایمیل خواهد شد.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-3 text-sm mt-2 font-bold"
                >
                  {loading ? "در حال ارسال..." : "ارسال کد تأیید"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    کد تأیید ارسال‌شده به <strong>{otpIdentifier}</strong> را وارد نمایید:
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    dir="ltr"
                    className="w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-[var(--color-border)] py-3 bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-ink-mute)]">
                  {countdown > 0 ? (
                    <span>ارسال مجدد تا {countdown} ثانیه دیگر</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-[var(--color-accent)] hover:underline font-bold"
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOtpStep("request")}
                    className="text-[var(--color-ink-soft)] hover:underline"
                  >
                    تغییر شماره
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
          </div>
        )}

        {/* 3. Register */}
        {mode === "signup" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="سهراب سپهری"
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">
                ایمیل
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">
                شماره موبایل (اختیاری)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09121234567"
                dir="ltr"
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1">
                رمز عبور
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                dir="ltr"
                className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:border-[var(--color-accent)] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm mt-2 font-bold"
            >
              {loading ? "در حال ثبت‌نام..." : "ایجاد حساب کاربری"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
