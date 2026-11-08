"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  bodyClassName?: string;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  bodyClassName,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="glass-overlay fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={clsx(
          "glass-panel relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl text-[var(--color-ink)] outline-none sm:max-h-[88vh]",
          SIZE_CLASSES[size],
        )}
      >
        <header className="relative flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
          <h2
            id={titleId}
            className="flex min-w-0 items-center gap-2.5 text-lg font-semibold text-[var(--color-wood)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] active:scale-95"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          className={clsx(
            "glass-scroll relative flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="relative border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
