import React from "react";
import { cn } from "@/lib/utils";
import { contactStatusMeta, orderStatusMeta } from "@/lib/commerce";

export function StatusBadge({
  status,
  kind = "order",
  className,
}: {
  status: string;
  kind?: "order" | "contact";
  className?: string;
}) {
  const meta = kind === "contact" ? contactStatusMeta(status) : orderStatusMeta(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        meta.badgeClass,
        className
      )}
    >
      {meta.label}
    </span>
  );
}
