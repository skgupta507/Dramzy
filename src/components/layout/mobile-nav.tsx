"use client";

import Link from "next/link";
import * as React from "react";
import { Flame } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useLockBody } from "@/hooks/use-lock-body";
import { cn } from "@/lib/utils";
import type { MainNavItem } from "@/types";

interface MobileNavProps {
  items: MainNavItem[];
  children?: React.ReactNode;
}

export function MobileNav({ items, children }: MobileNavProps) {
  useLockBody();

  return (
    <div className="fixed inset-0 top-16 z-50 h-[calc(100vh-4rem)] overflow-auto animate-in slide-in-from-top-4 md:hidden">
      <div className="relative z-20 m-4 rounded-sm border border-brand-900/40 bg-[#161b27]/95 backdrop-blur-md p-6 shadow-glow-lg space-y-6">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-brand-600" strokeWidth={1.5} />
          <span className="font-heading font-black text-base tracking-[0.2em] text-white glow-text-subtle">
            {siteConfig.name}
          </span>
        </div>

        <nav className="grid gap-1">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex w-full items-center rounded-sm px-3 py-2.5 font-heading text-xs tracking-[0.2em] uppercase transition-all",
                "text-muted-foreground hover:text-white hover:bg-brand-950/60 hover:border-brand-700/40",
                "border border-transparent",
                item.disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {children}

        <div className="infernal-divider" />
        <p className="font-heading text-xs text-brand-700/60 tracking-widest text-center">
          WHERE SHADOWS TELL STORIES
        </p>
      </div>
    </div>
  );
}
