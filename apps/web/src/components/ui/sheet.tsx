import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: "right" | "left" | "top" | "bottom";
  className?: string;
  children: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  side = "right",
  className,
  children,
}: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Lock scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sideClasses = {
    right: "fixed inset-y-0 right-0 h-full w-full sm:max-w-md animate-in slide-in-from-right duration-300",
    left: "fixed inset-y-0 left-0 h-full w-full sm:max-w-md animate-in slide-in-from-left duration-300",
    top: "fixed inset-x-0 top-0 w-full animate-in slide-in-from-top duration-300",
    bottom: "fixed inset-x-0 bottom-0 w-full animate-in slide-in-from-bottom duration-300",
  }[side];

  const content = (
    <div className="fixed inset-0 z-50" dir="rtl">
      {/* Fullscreen Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel - Full screen height */}
      <div
        className={cn(
          "z-50 flex flex-col bg-[#faf8f5] text-[#2b1e17] shadow-2xl border-l border-[#e8ded3] overflow-y-auto",
          sideClasses,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

export function SheetHeader({
  className,
  children,
  onClose,
}: {
  className?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-5 sm:p-6 border-b border-stone-200/80 sticky top-0 bg-[#fcfbf9]/95 backdrop-blur-md z-10",
        className
      )}
    >
      <div className="flex flex-col space-y-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function SheetTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn("text-lg font-bold font-serif text-stone-900", className)}
    >
      {children}
    </h2>
  );
}

export function SheetDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-xs text-stone-500", className)}>{children}</p>
  );
}

export function SheetContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex-1 p-5 sm:p-6", className)}>{children}</div>;
}

export function SheetFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "p-5 sm:p-6 border-t border-stone-200/80 bg-stone-50/50 mt-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
