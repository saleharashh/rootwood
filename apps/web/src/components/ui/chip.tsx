import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all duration-150 select-none border active:scale-95",
  {
    variants: {
      selected: {
        true: "bg-[#8c4f27] text-white border-[#8c4f27] shadow-xs font-semibold ring-1 ring-[#8c4f27]/20",
        false:
          "bg-white text-[#4a2c1b] border-[#e2d5c7] hover:bg-[#fbf4ec] hover:border-[#b58057] shadow-2xs",
      },
      size: {
        default: "text-xs px-3 py-1.5",
        sm: "text-[11px] px-2.5 py-1",
        lg: "text-sm px-4 py-2",
      },
    },
    defaultVariants: {
      selected: false,
      size: "default",
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean;
  onRemove?: () => void;
  dotColor?: string;
  count?: number;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, size, onRemove, dotColor, count, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(chipVariants({ selected, size }), className)}
        {...props}
      >
        {dotColor && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />
        )}
        <span>{children}</span>
        {count !== undefined && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              selected ? "bg-amber-800 text-amber-100" : "bg-stone-100 text-stone-600"
            )}
          >
            {count}
          </span>
        )}
        {onRemove && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="hover:opacity-75 p-0.5 rounded-full"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>
    );
  }
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
