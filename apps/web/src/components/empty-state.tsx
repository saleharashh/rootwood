import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[var(--color-ink-soft)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
