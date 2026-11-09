import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-stone-900 text-stone-50 shadow-2xs hover:bg-stone-800",
        secondary:
          "border-transparent bg-stone-100 text-stone-800 hover:bg-stone-200/80",
        destructive:
          "border-transparent bg-red-100 text-red-800 border border-red-200",
        outline:
          "border border-stone-200 text-stone-700 bg-white/80",
        wood:
          "border border-amber-900/20 bg-amber-50 text-amber-950 font-medium",
        gold:
          "border border-amber-400/30 bg-amber-500/10 text-amber-800 font-bold",
        success:
          "border border-emerald-200 bg-emerald-50 text-emerald-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
