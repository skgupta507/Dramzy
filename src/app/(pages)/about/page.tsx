import { Metadata } from "next";
import { Tv2, Eye, Shield, Heart } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Dramzy — built with love for Korean drama.",
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen">
      {/* Subtle top glow */}
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(14,165,233,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Hero */}
      <div className="relative py-20 px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-brand-600/20 border border-brand-700/30 flex items-center justify-center">
            <Tv2 className="w-8 h-8 text-brand-400" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="font-heading text-5xl lg:text-7xl text-white tracking-wide mb-3">
          ABOUT DRAMZY
        </h1>
        <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
          Stream Without Limits
        </p>
      </div>

      <div className="container max-w-3xl mx-auto px-4 pb-20 space-y-14">
        <div className="border-t border-border/30" />

        {/* Origin */}
        <section className="space-y-5">
          <h2 className="font-heading text-3xl text-white tracking-wide">The Origin</h2>
          <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
            <p>
              Dramzy started with a simple idea: Korean drama is one of the most compelling storytelling
              traditions in the world, and it deserves a platform that treats it with the same care and
              craft that goes into the stories themselves.
            </p>
            <p>
              Too many streaming sites bury great dramas behind cluttered interfaces, broken players,
              and paywalls. Dramzy was built to fix that — clean, fast, free, and built with genuine
              love for the genre.
            </p>
          </div>
        </section>

        {/* The real reason — personal touch, sweet and discrete */}
        <section className="relative overflow-hidden rounded-xl border border-white/6 bg-secondary/20 p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(14,165,233,0.04)_0%,transparent_70%)]" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
              <h3 className="font-heading text-xl text-white tracking-wide">Why Dramzy Exists</h3>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Honestly? This whole thing was built for someone special. Someone who stays up way too late
              watching episode after episode, who cries at the right moments and laughs at all the wrong ones,
              and who made me want to build something worthy of her hobby.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Her name is{" "}
              <span className="text-white font-semibold">
                Shy
              </span>
              <span className="text-red-500 ml-1" aria-hidden="true">♥</span>
              {" "}— and every drama she&apos;ll ever want to watch should be one click away,
              no subscriptions, no hassle, no broken streams. Just the story.
            </p>
            <p className="text-sm text-muted-foreground/60 italic">
              This one&apos;s for you.
            </p>
          </div>
        </section>

        {/* Our Creed */}
        <section className="space-y-6">
          <h2 className="font-heading text-3xl text-white tracking-wide">Our Creed</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Tv2,
                title: "Story First",
                desc: "Every design decision points to one thing — getting you into the drama faster, with fewer distractions.",
              },
              {
                icon: Eye,
                title: "No Compromise",
                desc: "HD streams, clean interface, responsive on any device. Dramzy doesn't cut corners.",
              },
              {
                icon: Shield,
                title: "Free Forever",
                desc: "Great drama is for everyone. Dramzy will never hide its content behind a subscription.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-white/6 rounded-lg p-5 bg-secondary/20 space-y-3 hover:border-brand-700/30 transition-colors">
                <div className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center">
                  <Icon className="w-4 h-4 text-brand-400" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-base text-white tracking-wider">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Creator */}
        <section className="relative overflow-hidden rounded-xl border border-white/6 p-8 bg-gradient-to-br from-brand-950/20 via-secondary/20 to-secondary/10">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-brand-400 tracking-widest uppercase">Creator</p>
            <h3 className="font-heading text-4xl text-white tracking-wide">SUNIL</h3>
            <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
              Developer, designer, and reluctant K-drama expert (by osmosis). Built Dramzy from scratch
              using Next.js 15, the Xyra Stream API, and too many late nights. Every pixel placed
              with intention — and with someone specific in mind.
            </p>
            <div className="flex gap-3 pt-1">
              <Link href="/privacy" className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
                Terms
              </Link>
              <Link href="/dmca" className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">
                DMCA
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
