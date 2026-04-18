"use client";

import { cn } from "@/lib/utils";
import NextImage, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = ImageProps & {
  errorText: string;
};

export function WithErrorImage({ className, errorText, src, ...props }: Props) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <NextImage
      {...props}
      src={imgSrc}
      className={cn(className)}
      onError={() => setImgSrc("/placeholder.svg")}
      unoptimized
    />
  );
}
