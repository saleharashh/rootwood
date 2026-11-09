import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b85d19]/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        /* 10% Accent CTA */
        default:
          "bg-[#b85d19] text-white shadow-xs hover:bg-[#9e4e13] hover:shadow-sm active:bg-[#87400d]",
        /* 30% Structural Deep Timber */
        wood:
          "bg-[#54311c] text-[#faf8f5] shadow-xs hover:bg-[#432615] border border-[#784725]/30",
        destructive:
          "bg-red-700 text-white shadow-xs hover:bg-red-800",
        /* 30% Structural Outline */
        outline:
          "border border-[#e8ded3] bg-white text-[#2b1e17] shadow-2xs hover:bg-[#fdf1e7] hover:border-[#b85d19]/50 hover:text-[#b85d19]",
        /* 30% Structural Secondary Muted */
        secondary:
          "bg-[#f2e7dc] text-[#2b1e17] shadow-2xs hover:bg-[#e8dbce]",
        ghost:
          "text-[#655347] hover:bg-[#f2e7dc]/70 hover:text-[#2b1e17]",
        link:
          "text-[#b85d19] underline-offset-4 hover:underline p-0 h-auto font-medium",
        gold:
          "bg-gradient-to-r from-[#b85d19] via-[#c96e28] to-[#b85d19] text-white shadow-xs hover:brightness-105",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8.5 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base font-bold",
        icon: "h-10 w-10 p-0 rounded-xl",
        iconSm: "h-8 w-8 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
