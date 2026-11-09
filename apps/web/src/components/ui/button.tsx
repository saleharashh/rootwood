import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-amber-950 text-amber-50 shadow-sm hover:bg-amber-900 hover:shadow-md",
        wood:
          "bg-[#241711] text-[#fbf8f5] shadow-sm hover:bg-[#38241b] border border-[#4a3225]/40",
        destructive:
          "bg-red-700 text-white shadow-xs hover:bg-red-800",
        outline:
          "border border-stone-300/80 bg-white/90 text-stone-800 shadow-2xs hover:bg-stone-50 hover:border-amber-900/50 hover:text-amber-950",
        secondary:
          "bg-stone-100 text-stone-800 shadow-2xs hover:bg-stone-200/80",
        ghost:
          "text-stone-700 hover:bg-stone-100/80 hover:text-stone-900",
        link:
          "text-amber-900 underline-offset-4 hover:underline p-0 h-auto font-medium",
        gold:
          "bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white shadow-sm hover:brightness-110",
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
