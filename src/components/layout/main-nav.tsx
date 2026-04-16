"use client";

import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MainNav({ items }: { items?: NavItem[] }) {
  const pathname = usePathname();
  if (!items?.length) return null;
  return (
    <nav className="hidden md:flex items-center gap-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded transition-all",
              active
                ? "text-white bg-white/8"
                : "text-muted-foreground hover:text-white hover:bg-white/5",
            )}>
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
