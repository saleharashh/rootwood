import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "right" | "left" | "top" | "bottom";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  className?: string;
  children: React.ReactNode;
}

const PANEL_POSITION: Record<Side, string> = {
  right: "fixed inset-y-0 right-0 h-full",
  left: "fixed inset-y-0 left-0 h-full",
  top: "fixed inset-x-0 top-0 w-full",
  bottom: "fixed inset-x-0 bottom-0 w-full",
};


export function Sheet({ open, onClose, side = "right", className, children }: SheetProps) {
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

  if (typeof document === "undefined") return null;

  const isSide = side === "right" || side === "left";

  const content = (
    open && (
        <div className="fixed inset-0 z-50" dir="rtl">
          {/* Scrim */}
          <div
            className="sheet-scrim fixed inset-0 bg-stone-950/50 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel: on phones the side sheet takes most of the viewport, leaving the scrim visible. */}
          <div
            className={cn(
              `sheet-panel sheet-panel-${side}`,
              "z-50 flex flex-col overflow-y-auto bg-[#faf8f5] text-[#2b1e17] shadow-2xl",
              PANEL_POSITION[side],
              isSide &&
                "w-[86vw] max-w-[360px] sm:w-[420px] sm:max-w-[420px] " +
                  (side === "right"
                    ? "rounded-l-3xl border-l border-[#e8ded3]"
                    : "rounded-r-3xl border-r border-[#e8ded3]"),
              !isSide && "max-h-[88vh] rounded-t-3xl",
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </div>
        </div>
      )
  );

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
    <h2 className={cn("text-lg font-bold font-serif text-stone-900", className)}>{children}</h2>
  );
}

export function SheetDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-xs text-stone-500", className)}>{children}</p>;
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
    <div className={cn("p-5 sm:p-6 border-t border-stone-200/80 bg-stone-50/50 mt-auto", className)}>
      {children}
    </div>
  );
}
