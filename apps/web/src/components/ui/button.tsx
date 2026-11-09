import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#8c4f27] text-white shadow-xs hover:bg-[#78401d] hover:shadow-sm",
        wood:
          "bg-[#78401d] text-[#fcfaf7] shadow-xs hover:bg-[#633316] border border-[#93532a]/20",
        destructive:
          "bg-red-700 text-white shadow-xs hover:bg-red-800",
        outline:
          "border border-[#e2d5c7] bg-white/90 text-[#3b2214] shadow-2xs hover:bg-[#fbf4ec] hover:border-[#8c4f27]/50 hover:text-[#78401d]",
        secondary:
          "bg-[#f5ecdf] text-[#4a2c1b] shadow-2xs hover:bg-[#ede1d0]",
        ghost:
          "text-[#543c2f] hover:bg-[#f5ecdf]/80 hover:text-[#2a1c14]",
        link:
          "text-[#8c4f27] underline-offset-4 hover:underline p-0 h-auto font-medium",
        gold:
          "bg-gradient-to-r from-[#9c5d31] via-[#b87333] to-[#8c4f27] text-white shadow-xs hover:brightness-105",
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
