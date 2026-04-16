import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const typographyVariants = cva(
  "scroll-m-20 tracking-tight",
  {
    variants: {
      variant: {
        h1: "font-heading font-black text-4xl lg:text-5xl text-white glow-text-subtle",
        h2: "font-heading font-bold text-3xl text-white first:mt-0",
        h3: "font-heading font-bold text-2xl text-white",
        h4: "font-heading font-semibold text-xl text-white/90",
        p: "scroll-m-0 font-sans font-normal leading-7 text-white/70 [&:not(:first-child)]:mt-6",
        blockquote: "mt-6 border-l-2 border-brand-700 pl-6 italic font-sans text-white/60",
      },
    },
    defaultVariants: {
      variant: "p",
    },
  },
);

interface TypographyProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

export function Typography({
  className,
  as: Comp = "p",
  variant,
  ...props
}: TypographyProps) {
  return (
    <Comp
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    />
  );
}
