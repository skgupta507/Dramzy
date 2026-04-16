"use client";

import { cn } from "@/lib/utils";
import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = ImageProps & {
  errorText: string;
};

export function WithErrorImage({ className, errorText, src, ...props }: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <NextImage
      {...props}
      src={imgSrc}
      className={cn(
        className,
        isLoading ? "scale-105 blur-sm" : "scale-100 blur-0",
        "transition-all duration-500",
      )}
      onError={() => setImgSrc("/placeholder.svg")}
      onLoad={() => setIsLoading(false)}
      unoptimized
    />
  );
}
