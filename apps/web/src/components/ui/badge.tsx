import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#2b1e17] text-[#faf8f5] shadow-2xs hover:bg-[#3d2c22]",
        secondary:
          "border border-[#e8ded3] bg-[#f2e7dc] text-[#54311c] hover:bg-[#e8dbce]",
        destructive:
          "border-transparent bg-red-100 text-red-800 border border-red-200",
        outline:
          "border border-[#e8ded3] text-[#655347] bg-white",
        wood:
          "border border-[#edd1bc] bg-[#fdf1e7] text-[#b85d19] font-semibold",
        gold:
          "border border-[#edd1bc] bg-[#fdf1e7] text-[#b85d19] font-bold",
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
