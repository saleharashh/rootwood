import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, id, ...props }, ref) => {
    const selectId = id || React.useId();

    return (
      <div className="relative w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-stone-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "flex h-10 w-full appearance-none rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 pl-9 text-xs sm:text-sm text-stone-900 shadow-2xs transition-colors focus-visible:outline-none focus-visible:border-amber-900 focus-visible:ring-2 focus-visible:ring-amber-900/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
