import { Card } from "@/components/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { discover, getTrending } from "@/lib/dramacool";
import Link from "next/link";
import type { Metadata } from "next";

export interface CountryConfig {
  country: string;           // API filter value e.g. "South Korea"
  label: string;             // Display name
  flag: string;              // Emoji flag
  color: string;             // Tailwind gradient classes
  accentColor: string;       // e.g. "brand-400"
  description: string;
  genres: string[];
  funFacts: string[];
}

export function buildMetadata(cfg: CountryConfig): Metadata {
  return {
    title: `${cfg.flag} ${cfg.label} Dramas`,
    description: cfg.description,
  };
}

export async function CountryDramaPage({ cfg }: { cfg: CountryConfig }) {
  const [popular, recent, romance, action] = await Promise.allSettled([
    discover(1, { country: cfg.country }),
    discover(1, { country: cfg.country, release_year: "2024" }),
    discover(1, { country: cfg.country, genre: "Romance" }),
    discover(1, { country: cfg.country, genre: "Action" }),
  ]);

  const popularDramas = popular.status === "fulfilled" ? popular.value.results : [];
  const recentDramas  = recent.status  === "fulfilled" ? recent.value.results  : [];
  const romanceDramas = romance.status === "fulfilled" ? romance.value.results : [];
  const actionDramas  = action.status  === "fulfilled" ? action.value.results  : [];

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden py-20 px-4 ${cfg.color}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.04)_0%,transparent_70%)]" />
        <div className="relative z-10 container max-w-5xl mx-auto text-center space-y-5">
          <div className="text-6xl">{cfg.flag}</div>
          <h1 className="font-heading text-5xl lg:text-7xl text-white tracking-wide">
            {cfg.label.toUpperCase()} <span className="text-white/60">DRAMAS</span>
          </h1>
          <p className="text-base text-white/70 max-w-xl mx-auto leading-relaxed">{cfg.description}</p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {cfg.genres.map((g) => (
              <Link key={g} href={`/search?q=${encodeURIComponent(g)}`}>
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-white/20 transition-colors px-3 py-1">
                  {g}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fun facts strip ───────────────────────────────────────────────── */}
      <div className="bg-secondary/30 border-y border-white/5">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex gap-8 overflow-x-auto">
          {cfg.funFacts.map((fact, i) => (
            <div key={i} className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
              {fact}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="container max-w-5xl mx-auto px-4 py-10 space-y-12">

        {/* Popular */}
        {popularDramas.length > 0 && (
          <Section title={`Popular ${cfg.label} Dramas`} subtitle="Most watched of all time" href="/popular">
            <DramaRow dramas={popularDramas.slice(0, 20)} />
          </Section>
        )}

        {/* 2024/2025 */}
        {recentDramas.length > 0 && (
          <Section title="Recent Releases" subtitle="Latest from 2024–2025">
            <DramaRow dramas={recentDramas.slice(0, 20)} />
          </Section>
        )}

        {/* Genre rows */}
        {romanceDramas.length > 0 && (
          <Section title="💕 Romance" subtitle="Love stories that hit differently">
            <DramaRow dramas={romanceDramas.slice(0, 20)} />
          </Section>
        )}

        {actionDramas.length > 0 && (
          <Section title="⚔️ Action & Thriller" subtitle="Edge-of-your-seat suspense">
            <DramaRow dramas={actionDramas.slice(0, 20)} />
          </Section>
        )}

        {/* Country genres browsing grid */}
        <section>
          <h2 className="font-heading text-2xl text-white tracking-wide mb-5">Browse by Genre</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cfg.genres.map((g) => (
              <Link key={g} href={`/search?q=${encodeURIComponent(g + " " + cfg.label)}`}>
                <div className="relative overflow-hidden rounded-lg border border-white/6 bg-secondary/20 p-5 text-center hover:border-brand-700/40 hover:bg-brand-950/20 transition-all group cursor-pointer">
                  <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{g}</p>
                  <p className="text-xs text-muted-foreground mt-1">{cfg.label} · {g}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Go to search */}
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm mb-4">Can&apos;t find what you&apos;re looking for?</p>
          <Link href={`/search?q=${encodeURIComponent(cfg.label)}`}>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-colors">
              Search all {cfg.label} dramas →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, href, children }: {
  title: string; subtitle: string; href?: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-2xl text-white tracking-wide">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {href && (
          <Link href={href} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function DramaRow({ dramas }: { dramas: any[] }) {
  return (
    <ScrollArea>
      <div className="flex gap-3 pb-4">
        {dramas.map((d, i) => (
          <Card key={i} data={{ title: d.title, image: d.image, description: d.status ?? "", slug: d.id }}
            className="w-28 shrink-0 lg:w-[160px]" aspectRatio="portrait" width={160} height={230} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
