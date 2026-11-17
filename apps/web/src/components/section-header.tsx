import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <span className="block text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl font-bold text-[var(--color-ink)] font-serif sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="max-w-2xl text-xs leading-relaxed text-[var(--color-ink-soft)] sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
