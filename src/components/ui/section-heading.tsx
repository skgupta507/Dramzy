import { cn } from "@/lib/utils";
import { ChevronRight } from "@/components/icons";
import Link from "next/link";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  slogan?: string;
  href?: string;
  className?: string;
  icon?: ReactNode;
}

export function SectionHeading({ title, subtitle, slogan, href, className, icon }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-start justify-between mb-5", className)}>
      <div>
        <div className="flex items-center gap-2">
          {icon && <span className="mt-0.5">{icon}</span>}
          <h2 className="font-heading text-xl text-white tracking-wide">{title}</h2>
        </div>
        {subtitle && <p className="text-muted-foreground text-sm mt-0.5 ml-6">{subtitle}</p>}
        {slogan && <p className="text-muted-foreground/60 text-xs mt-0.5 ml-6">{slogan}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors shrink-0 mt-1">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
