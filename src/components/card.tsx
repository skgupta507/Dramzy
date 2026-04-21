"use client";

import { WithErrorImage } from "@/components/modified-image";
import { cn } from "@/lib/utils";
import { Play } from "@/components/icons";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

interface CardData {
  title: string;
  image: string;
  description?: string;
  slug?: string;
  link?: string;
}

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  data: CardData;
  aspectRatio?: "portrait" | "square";
  width: number;
  height: number;
  prefetch?: boolean;
}

export function Card({
  data,
  aspectRatio = "portrait",
  width,
  height,
  prefetch = true,
  className,
  ...props
}: CardProps) {
  const href = data.slug ? `/drama/${data.slug}` : data.link ?? "#";

  return (
    <div className={cn("space-y-2 group cursor-pointer", className)} {...props}>
      <div className="relative overflow-hidden rounded border border-white/5 hover:border-brand-500/30 transition-colors duration-300 shadow-card hover:shadow-card-hover">
        <Link href={href} prefetch={prefetch}>
          {/* Image — pure CSS hover via group, no JS state */}
          <WithErrorImage
            src={data.image}
            alt={data.title}
            width={width}
            height={height}
            errorText={data.title}
            priority={false}
            className={cn(
              "h-full w-full object-cover",
              "group-hover:scale-105 group-hover:brightness-75",
              "transition-transform transition-[filter] duration-300",
              aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
            )}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          {/* Play icon — pure CSS opacity via group */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-11 h-11 rounded-full bg-brand-600/90 border border-brand-400/40 flex items-center justify-center shadow-glow">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </Link>
      </div>
      {/* Title */}
      <h3 className="line-clamp-2 text-xs font-medium text-white/85 leading-snug group-hover:text-brand-300 transition-colors px-0.5">
        {data.title}
      </h3>
    </div>
  );
}
