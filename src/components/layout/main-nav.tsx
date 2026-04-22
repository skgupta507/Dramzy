"use client";

import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const COUNTRY_LINKS = [
  { title: "🇰🇷 Korean",   href: "/dramas/korean" },
  { title: "🇨🇳 Chinese",  href: "/dramas/chinese" },
  { title: "🇹🇭 Thai",     href: "/dramas/thai" },
  { title: "🇯🇵 Japanese", href: "/dramas/japanese" },
];

const MAIN_LINKS = [
  { title: "Home",    href: "/home" },
  { title: "Popular", href: "/popular" },
  { title: "Search",  href: "/search" },
];

export function MainNav({ items }: { items?: NavItem[] }) {
  const pathname = usePathname();
  const isCountryActive = COUNTRY_LINKS.some((l) => pathname.startsWith(l.href));

  return (
    <nav className="hidden md:flex items-center gap-1">
      {MAIN_LINKS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded transition-all",
              active ? "text-white bg-white/8" : "text-muted-foreground hover:text-white hover:bg-white/5",
            )}>
            {item.title}
          </Link>
        );
      })}

      {/* Countries dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-all outline-none",
            isCountryActive ? "text-white bg-white/8" : "text-muted-foreground hover:text-white hover:bg-white/5",
          )}>
            Countries <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 bg-[#161b27] border-white/10">
          {COUNTRY_LINKS.map((l) => (
            <DropdownMenuItem key={l.href} asChild>
              <Link href={l.href} className={cn(
                "cursor-pointer text-sm",
                pathname.startsWith(l.href) ? "text-brand-400" : "text-muted-foreground",
              )}>
                {l.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
