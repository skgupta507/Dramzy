"use client";

import { WithErrorImage } from "@/components/modified-image";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  data: { title: string; image: string; slug?: string; link?: string; description: string };
  aspectRatio?: "portrait" | "square";
  width: number;
  height: number;
  progress?: number;
  prefetch?: boolean;
}

export function Card({ data, progress, aspectRatio = "portrait", width, height, className, prefetch = true, ...props }: CardProps) {
  const href = data.slug ? `/drama/${data.slug}` : data.link ?? "#";
  const [hovered, setHovered] = useState(false);

  return (
    <div className={cn("space-y-2 group", className)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} {...props}>
      <div className={cn(
        "relative overflow-hidden rounded transition-all duration-300",
        "shadow-card hover:shadow-card-hover",
        "border border-white/5 hover:border-brand-500/30",
      )}>
        <Link href={href} prefetch={prefetch}>
          <WithErrorImage
            src={data.image} alt={data.title} width={width} height={height} errorText={data.title} priority
            className={cn(
              "h-full w-full object-cover transition-all duration-400",
              "group-hover:scale-105 group-hover:brightness-70",
              aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          {/* Hover overlay */}
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300",
            hovered ? "opacity-100" : "opacity-0",
          )}>
            <div className="w-11 h-11 rounded-full bg-brand-600/90 border border-brand-400/40 flex items-center justify-center shadow-glow">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </Link>
        {progress != null && (
          <Progress value={progress} className="absolute bottom-0 left-0 h-0.5 rounded-none bg-black/50 [&>div]:bg-brand-500" />
        )}
      </div>
      <div className="space-y-0.5 px-0.5">
        <h3 className="line-clamp-2 text-xs font-medium text-white/85 leading-snug group-hover:text-brand-300 transition-colors">
          {data.title}
        </h3>
        {data.description && (
          <p className="text-muted-foreground text-xs">{data.description}</p>
        )}
      </div>
    </div>
  );
}
