import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 shadow-2xs transition-colors placeholder:text-stone-400 focus-visible:outline-none focus-visible:border-amber-900 focus-visible:ring-2 focus-visible:ring-amber-900/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
