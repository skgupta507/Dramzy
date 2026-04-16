import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  slogan?: string;
  href?: string;
  className?: string;
}

export function SectionHeading({ title, subtitle, slogan, href, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-end justify-between mb-4", className)}>
      <div>
        <h2 className="font-heading text-2xl text-white tracking-wider">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
