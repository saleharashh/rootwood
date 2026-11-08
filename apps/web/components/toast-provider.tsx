"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (message: string, variant?: Toast["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<Toast["variant"], string> = {
  success:
    "border-[var(--color-success)]/30 bg-white text-[#2d491d]",
  error:
    "border-[var(--color-error)]/30 bg-white text-[var(--color-error)]",
  info: "border-[var(--color-border)] bg-white text-[var(--color-ink)]",
};

const TOAST_ICONS: Record<Toast["variant"], typeof Info> = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: Toast["variant"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 start-4 end-4 z-[80] flex flex-col gap-2.5 sm:start-auto sm:end-6 sm:max-w-sm"
      >
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm font-semibold shadow-lg transition-all ${TOAST_STYLES[t.variant]}`}
            >
              <span className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" aria-hidden />
                <span className="leading-5">{t.message}</span>
              </span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="بستن"
                className="cursor-pointer text-current opacity-50 transition-opacity hover:opacity-100 p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast باید داخل ToastProvider استفاده شود");
  }
  return ctx;
}
