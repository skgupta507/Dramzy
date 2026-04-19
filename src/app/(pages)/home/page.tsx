import { Card as DramaCard } from "@/components/card";
import { FallBackCard as FallBack } from "@/components/fallbacks/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ApiUnavailableRow } from "@/components/ui/api-unavailable";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeatured, getRecent, getTrending, getUpcoming } from "@/lib/dramacool";
import { getWatchLists } from "@/lib/helpers/server";
import { generateMetadata } from "@/lib/utils";
import { ChevronRight, Play, Info, Zap, TrendingUp, Clock, CalendarDays, Bookmark, Tv2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const title = "Home";
const description = "Stream the finest Korean dramas — romance, thriller, revenge, and fantasy.";
export const metadata = generateMetadata({ title, description });

// ─── Cache config: pages are statically generated and revalidated ─────────────
// Vercel Hobby plan optimization: aggressive ISR caching reduces function invocations
export const revalidate = 300; // 5 minutes

export default function Page() {
  return (
    <div className="relative min-h-screen">

      {/* ── Hero Carousel ─────────────────────────────────────────────────── */}
      <section className="w-full">
        <Suspense fallback={
          <div className="w-full bg-black" style={{ aspectRatio: "16/7" }}>
            <Skeleton className="size-full rounded-none" />
          </div>
        }>
          <HeroBanner />
        </Suspense>
      </section>

      {/* ── Content grid ──────────────────────────────────────────────────── */}
      <div className="mx-auto w-screen px-4 py-8 lg:container lg:py-10 space-y-12">

        {/* Watchlist row */}
        <section>
          <SectionHeading
            title="My Watchlist"
            subtitle="Pick up where you left off"
            icon={<Bookmark className="w-4 h-4 text-brand-500" />}
          />
          <ScrollArea>
            <div className="flex gap-3 pb-4">
              <Suspense fallback={<FallBack />}><WatchList /></Suspense>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Recently Added */}
        <section>
          <SectionHeading
            title="Recently Added"
            subtitle="Hot off the press — new episodes"
            icon={<Clock className="w-4 h-4 text-brand-500" />}
          />
          <ScrollArea>
            <div className="flex gap-3 pb-4">
              <Suspense fallback={<FallBack />}><Recent /></Suspense>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Trending + Spotlight grid */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <SectionHeading
              title="Trending Now"
              subtitle="Most watched this week"
              icon={<TrendingUp className="w-4 h-4 text-brand-500" />}
              className="mb-0"
            />
            <Link href="/popular" className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <Suspense fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
            </div>
          }>
            <TrendingGrid />
          </Suspense>
        </section>

        {/* Genre quick-links */}
        <section>
          <SectionHeading
            title="Browse by Genre"
            subtitle="Find your next obsession"
            icon={<Star className="w-4 h-4 text-brand-500" />}
          />
          <div className="flex flex-wrap gap-2.5">
            {GENRES.map((g) => (
              <Link key={g.label} href={`/search?q=${encodeURIComponent(g.label)}`}>
                <div className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all hover:scale-105 ${g.color}`}>
                  <span className="mr-2">{g.icon}</span>{g.label}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming dramas */}
        <section>
          <SectionHeading
            title="Coming Soon"
            subtitle="Mark your calendar"
            icon={<CalendarDays className="w-4 h-4 text-brand-500" />}
            href="/popular"
          />
          <ScrollArea>
            <div className="flex gap-3 pb-4">
              <Suspense fallback={<FallBack />}><Upcoming /></Suspense>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Stats banner */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="relative overflow-hidden rounded-lg border border-white/6 bg-secondary/20 p-5 text-center hover:border-brand-700/30 transition-colors">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_100%,rgba(14,165,233,0.04)_0%,transparent_70%)]" />
              <p className="font-heading text-3xl text-white tracking-wide relative">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 relative">{s.label}</p>
            </div>
          ))}
        </section>

        {/* CTA Banner */}
        <section className="relative overflow-hidden rounded-xl border border-brand-700/20 p-8 lg:p-12 bg-gradient-to-br from-brand-950/50 via-[#0f1117] to-[#0f1117]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_50%,rgba(14,165,233,0.10)_0%,transparent_70%)]" />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-[radial-gradient(ellipse_80%_80%_at_100%_50%,rgba(14,165,233,0.05)_0%,transparent_70%)] hidden lg:block" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Tv2 className="w-5 h-5 text-brand-400" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-brand-400 tracking-widest uppercase">Dramzy</span>
              </div>
              <h3 className="font-heading text-4xl lg:text-5xl text-white tracking-wide leading-none">
                Thousands of Dramas.<br />
                <span className="text-brand-400">Zero Subscriptions.</span>
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Korean, Japanese, Chinese, and Thai dramas — every genre, every year.
                Free forever, for everyone.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link href="/popular">
                <Button size="lg" className="min-w-[200px] gap-2">
                  Browse All Dramas <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/search">
                <Button size="lg" variant="outline" className="min-w-[200px] gap-2">
                  Search Dramas
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
// Uses /home endpoint which returns high-quality drama card images
async function HeroBanner() {
  const featured = await getFeatured();

  if (!featured?.length) {
    return (
      <div className="w-full bg-[#0c0f16] border-b border-border" style={{ aspectRatio: "16/7" }}>
        <div className="size-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <Zap className="w-10 h-10 text-brand-600 mx-auto fill-brand-600" strokeWidth={2} />
            <p className="font-heading text-2xl text-white tracking-widest">DRAMZY</p>
            <p className="text-xs text-muted-foreground">API connecting… check your XYRA_API_KEY</p>
          </div>
        </div>
      </div>
    );
  }

  // Take up to 6 featured items for the carousel
  const items = featured.slice(0, 6);

  return (
    <Carousel className="w-full overflow-hidden" opts={{ loop: true }}>
      <CarouselContent>
        {items.map((item, i) => (
          <CarouselItem key={item.id || i} className="basis-full">
            <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
              {/* High-quality drama image — served from CDN at source resolution */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover object-top"
                priority={i === 0}
                sizes="100vw"
                unoptimized
              />
              {/* Gradient overlays for text legibility — no brightness filter on image */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117]/85 via-[#0f1117]/30 to-transparent" />

              {/* Content overlay */}
              <div className="absolute inset-0 flex items-end">
                <div className="p-6 lg:p-14 max-w-2xl space-y-4">
                  {item.type && (
                    <Badge variant="secondary" className="text-xs uppercase tracking-widest">
                      {item.type}
                    </Badge>
                  )}
                  <h2 className="font-heading text-4xl lg:text-6xl text-white tracking-wide leading-none drop-shadow-2xl">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/drama/${item.id}`}>
                      <Button size="default" className="gap-2 shadow-glow-sm">
                        <Play className="w-4 h-4 fill-white" /> Watch Now
                      </Button>
                    </Link>
                    <Link href={`/drama/${item.id}`}>
                      <Button variant="outline" size="default" className="gap-2 bg-black/30 border-white/20 hover:bg-white/10">
                        <Info className="w-4 h-4" /> More Info
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Slide indicator */}
              <div className="absolute bottom-4 right-6 flex gap-1.5">
                {items.map((_, idx) => (
                  <div key={idx} className={`h-0.5 rounded-full transition-all ${idx === i ? "w-6 bg-brand-400" : "w-2 bg-white/30"}`} />
                ))}
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4 bg-black/60 border-white/10 text-white hover:bg-brand-600 hover:border-brand-500 hidden sm:flex" />
      <CarouselNext className="right-4 bg-black/60 border-white/10 text-white hover:bg-brand-600 hover:border-brand-500 hidden sm:flex" />
    </Carousel>
  );
}

// ─── Trending Grid ────────────────────────────────────────────────────────────
async function TrendingGrid() {
  const data = await getTrending();
  if (!data.results.length) return <ApiUnavailableRow />;
  const items = data.results.slice(0, 8);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-4">
      {items.map((drama, i) => (
        <DramaCard key={i}
          data={{ title: drama.title, image: drama.image, description: drama.status ?? "", slug: drama.id }}
          aspectRatio="portrait" width={200} height={280} className="w-full" />
      ))}
    </div>
  );
}

// ─── Recent row ───────────────────────────────────────────────────────────────
async function Recent() {
  const data = await getRecent();
  if (!data.results.length) return <ApiUnavailableRow />;
  return (
    <>
      {data.results.map((ep, i) => (
        <DramaCard key={i} prefetch={false}
          data={{ title: ep.title, image: ep.image, description: ep.status ?? "", link: `watch/${ep.id}` }}
          className="w-28 shrink-0 lg:w-[160px]" aspectRatio="portrait" width={160} height={230} />
      ))}
    </>
  );
}

// ─── Upcoming row ─────────────────────────────────────────────────────────────
async function Upcoming() {
  const data = await getUpcoming();
  if (!data.results.length) return <ApiUnavailableRow />;
  return (
    <>
      {data.results.slice(0, 15).map((drama, i) => (
        <DramaCard key={i} prefetch={false}
          data={{ title: drama.title, image: drama.image, description: "Coming soon", slug: drama.id }}
          className="w-28 shrink-0 lg:w-[160px]" aspectRatio="portrait" width={160} height={230} />
      ))}
    </>
  );
}

// ─── Watchlist row ────────────────────────────────────────────────────────────
async function WatchList() {
  const watchlists = await getWatchLists();
  const list = watchlists.filter((l) => [null, "watching", "plan_to_watch"].includes(l.status));
  if (!list.length) {
    return (
      <div className="flex items-center gap-3 py-6 px-5 border border-border/40 rounded-lg bg-secondary/20 text-sm text-muted-foreground">
        <Bookmark className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        <span>Your watchlist is empty. Browse dramas and add them to start tracking.</span>
        <Link href="/popular">
          <Button size="sm" variant="outline" className="shrink-0">Explore</Button>
        </Link>
      </div>
    );
  }
  return (
    <>
      {list.map(({ series: drama }, i) => drama && (
        <DramaCard key={i}
          data={{ title: drama.title, image: drama.coverImage ?? "/placeholder.svg", description: "", slug: drama.slug.replace("drama-detail/", "") }}
          className="w-28 shrink-0 lg:w-[160px]" aspectRatio="portrait" width={160} height={230} />
      ))}
    </>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────
const GENRES = [
  { label: "Romance",  icon: "💕", color: "border-pink-700/40 bg-pink-950/20 text-pink-300 hover:border-pink-500/60" },
  { label: "Thriller", icon: "🔪", color: "border-red-800/40 bg-red-950/20 text-red-300 hover:border-red-600/60" },
  { label: "Fantasy",  icon: "✨", color: "border-violet-700/40 bg-violet-950/20 text-violet-300 hover:border-violet-500/60" },
  { label: "Comedy",   icon: "😂", color: "border-yellow-700/40 bg-yellow-950/20 text-yellow-300 hover:border-yellow-500/60" },
  { label: "Historical",icon:"🏯", color: "border-amber-700/40 bg-amber-950/20 text-amber-300 hover:border-amber-600/60" },
  { label: "Sci-Fi",   icon: "🚀", color: "border-cyan-700/40 bg-cyan-950/20 text-cyan-300 hover:border-cyan-600/60" },
  { label: "Action",   icon: "⚔️", color: "border-orange-700/40 bg-orange-950/20 text-orange-300 hover:border-orange-600/60" },
  { label: "Mystery",  icon: "🔎", color: "border-slate-600/40 bg-slate-900/40 text-slate-300 hover:border-slate-500/60" },
  { label: "Horror",   icon: "👻", color: "border-zinc-600/40 bg-zinc-900/40 text-zinc-300 hover:border-zinc-500/60" },
  { label: "Medical",  icon: "🏥", color: "border-teal-700/40 bg-teal-950/20 text-teal-300 hover:border-teal-600/60" },
];

const STATS = [
  { value: "5,000+", label: "Dramas Available" },
  { value: "Free",   label: "Forever" },
  { value: "HD",     label: "Quality Streams" },
  { value: "10+",    label: "Countries" },
];
