import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, label, description, disabled, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-start gap-2.5 cursor-pointer select-none group",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className="sr-only"
            {...props}
          />
          <div
            className={cn(
              "w-4 h-4 rounded-md border transition-all duration-150 flex items-center justify-center",
              checked
                ? "bg-[#8c4f27] border-[#8c4f27] text-white shadow-2xs"
                : "border-stone-300 bg-white group-hover:border-[#8c4f27]/60"
            )}
          >
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col text-right">
            {label && (
              <span className="text-xs sm:text-sm font-medium text-stone-800 leading-tight group-hover:text-[#8c4f27] transition-colors">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-stone-500 mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
