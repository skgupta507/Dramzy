"use client";

import { Loading } from "@/components/fallbacks/loading";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  disabled,
  variant = "default",
  size = "sm",
  ...props
}: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      className={cn("flex gap-2", className)}
      size={size}
      variant={variant}
      type="submit"
      disabled={pending || disabled}
      {...props}
    >
      {pending ? <Loading /> : children}
    </Button>
  );
}
