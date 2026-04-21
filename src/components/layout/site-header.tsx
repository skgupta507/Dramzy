"use client";

import { MainNav } from "@/components/layout/main-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { LogOut, Search, Tv2, Zap } from "@/components/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface SiteHeaderProps extends React.ComponentPropsWithoutRef<"header"> {
  sticky?: boolean;
  session?: { user?: { name?: string | null; email?: string | null; image?: string | null } } | null;
}

export function SiteHeader({ sticky = true, className, session }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={cn(
      "w-full transition-all duration-300 z-50",
      sticky && "sticky top-0",
      scrolled
        ? "bg-[#0f1117]/95 backdrop-blur-md border-b border-white/5 shadow-[0_1px_0_rgba(255,255,255,0.05)]"
        : "bg-transparent",
      className,
    )}>
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all">
            <Zap className="w-4 h-4 text-white fill-white" strokeWidth={2} />
          </div>
          <span className="font-heading text-xl text-white tracking-widest group-hover:glow-text-subtle transition-all">
            Dramzy
          </span>
        </Link>

        <MainNav items={siteConfig.mainNav} />

        <div className="flex items-center gap-2">
          <SearchBar />
          <UserNav session={session} />
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {open ? (
        <form action="/search" onBlur={() => setTimeout(() => setOpen(false), 150)}>
          <Input autoFocus name="q" placeholder="Search dramas…"
            className="w-44 lg:w-60 h-8 text-sm bg-secondary/60" />
        </form>
      ) : (
        <Button size="icon" variant="ghost" onClick={() => setOpen(true)} className="h-8 w-8">
          <Search className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function UserNav({ session }: Pick<SiteHeaderProps, "session">) {
  if (!session) {
    return (
      <Link href="/signin">
        <Button size="sm" className="h-8 text-xs font-semibold tracking-wider">
          Sign In
        </Button>
      </Link>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ring-1 ring-border hover:ring-brand-500">
          <Avatar className="h-7 w-7">
            <AvatarImage src={session.user?.image ?? ""} />
            <AvatarFallback className="bg-brand-900 text-brand-300 text-xs font-bold">
              {(session.user?.name ?? "?")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="font-semibold text-sm text-foreground">{session.user?.name}</p>
          <p className="text-xs text-muted-foreground">{session.user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/home" className="gap-2 cursor-pointer">
            <Tv2 className="w-4 h-4" /> Watchlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/signout" className="gap-2 cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4" /> Sign Out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
