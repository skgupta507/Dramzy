import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-brand-700/50 bg-brand-900/40 text-brand-300",
        secondary: "border-border bg-secondary text-muted-foreground",
        destructive: "border-destructive/30 bg-destructive/20 text-destructive",
        outline: "border-border text-foreground",
        genre: "border-border bg-secondary/60 text-muted-foreground hover:border-brand-600/40 hover:text-brand-300 cursor-pointer transition-colors",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
