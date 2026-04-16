import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Play, Tv2, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen bg-[#0f1117] flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(14,165,233,0.1)_0%,transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* Navbar */}
      <header className="relative z-10 container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" strokeWidth={2} />
          </div>
          <span className="font-heading text-xl text-white tracking-widest">DRAMZY</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/home" className="text-sm text-muted-foreground hover:text-white transition-colors">Browse</Link>
          <Link href="/signin" className={buttonVariants({ variant: "outline", size: "sm" })}>Sign In</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex items-center">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8 py-20">
            <Badge variant="default" className="px-4 py-1.5 text-xs tracking-widest animate-fade-up">
              KOREAN DRAMA STREAMING
            </Badge>

            <h1 className="font-heading text-6xl lg:text-8xl text-white leading-none tracking-wide">
              <span className="block">DRAMZY</span>
              <span className="block text-brand-400 glow-text-subtle">STREAM FREE</span>
              <span className="block">K-DRAMAS</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              Romance, revenge, fantasy, thriller — thousands of Korean dramas, all in one place. Free forever.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/home" className={buttonVariants({ variant: "default", size: "lg" })}>
                <Play className="w-4 h-4 fill-white" /> Start Watching
              </Link>
              <Link href="/signin" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Sign In <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/50">
              {[
                { icon: Tv2, title: "All Genres", desc: "Romance, thriller, fantasy & more" },
                { icon: Zap, title: "HD Quality", desc: "Sharp streams, no buffering" },
                { icon: Shield, title: "Free Access", desc: "No subscription required" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="w-9 h-9 rounded border border-border bg-secondary flex items-center justify-center">
                      <Icon className="w-4 h-4 text-brand-400" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-10 container pb-6 text-center">
        <p className="text-xs text-muted-foreground/40 tracking-widest">CRAFTED BY SUNIL</p>
      </div>
    </div>
  );
}
