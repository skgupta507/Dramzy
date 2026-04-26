import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded border border-border bg-secondary/40 px-3 py-1 text-sm text-foreground shadow-sm transition-all",
        "placeholder:text-muted-foreground/50",
        "focus-visible:outline-none focus-visible:border-brand-600/70 focus-visible:ring-1 focus-visible:ring-brand-600/30",
        "hover:border-border/80",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
export type { InputProps };
