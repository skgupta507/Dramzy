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
import { getFeatured, getRecent, getTrending } from "@/lib/dramacool";
import { getWatchLists } from "@/lib/helpers/server";
import { generateMetadata } from "@/lib/utils";
import { ChevronRight, Play, Info, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

const title = "Home";
const description = "Stream the finest Korean dramas — romance, thriller, revenge, and fantasy.";
export const metadata = generateMetadata({ title, description });

export default function Page() {
  return (
    <div className="relative min-h-screen">
      {/* Hero */}
      <section className="w-full">
        <Suspense fallback={
          <AspectRatio ratio={16 / 6}>
            <Skeleton className="size-full" />
          </AspectRatio>
        }>
          <HeroBanner />
        </Suspense>
      </section>

      {/* Content */}
      <div className="mx-auto w-screen px-4 py-8 lg:container lg:py-10 space-y-10">

        {/* Watchlist */}
        <section>
          <SectionHeading title="My Watchlist" subtitle="Pick up where you left off" />
          <ScrollArea>
            <div className="flex gap-3 pb-4">
              <Suspense fallback={<FallBack />}><WatchList /></Suspense>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Recent */}
        <section>
          <SectionHeading title="Recently Added" subtitle="New episodes just dropped" />
          <ScrollArea>
            <div className="flex gap-3 pb-4">
              <Suspense fallback={<FallBack />}><Recent /></Suspense>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Trending */}
        <section>
          <SectionHeading title="Trending Now" subtitle="Most watched this week" href="/popular" />
          <ScrollArea>
            <div className="flex gap-3 pb-4">
              <Suspense fallback={<FallBack />}><Trending /></Suspense>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* CTA Banner */}
        <section className="relative overflow-hidden rounded-lg border border-brand-700/20 p-8 bg-gradient-to-br from-brand-950/40 via-[#0f1117] to-[#0f1117]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_0%_50%,rgba(14,165,233,0.12)_0%,transparent_70%)]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-400 fill-brand-400" strokeWidth={2} />
                <span className="text-xs font-semibold text-brand-400 tracking-widest uppercase">Explore</span>
              </div>
              <h3 className="font-heading text-3xl text-white tracking-wide">Browse All Dramas</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Thousands of Korean, Japanese, Chinese, and Thai dramas — all genres, all years.
              </p>
            </div>
            <Link href="/popular">
              <Button size="lg" className="min-w-[180px] gap-2">
                Browse Popular <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

async function HeroBanner() {
  const featured = await getFeatured();

  if (!featured?.length) {
    return (
      <div className="w-full bg-[#0c0f16] border-b border-border" style={{ aspectRatio: "16/6" }}>
        <div className="size-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <Zap className="w-10 h-10 text-brand-600 mx-auto fill-brand-600" strokeWidth={2} />
            <p className="font-heading text-2xl text-white tracking-widest">Dramzy</p>
            <p className="text-xs text-muted-foreground">API connecting… check your XYRA_API_KEY</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Carousel className="w-full overflow-hidden" opts={{ loop: true }}>
      <CarouselContent>
        {featured.map((item, i) => (
          <CarouselItem key={item.id || i} className="basis-full">
            <div className="relative w-full" style={{ aspectRatio: "16/6" }}>
              <Image
                src={item.image} alt={item.title} fill
                className="object-cover brightness-55"
                priority={i === 0}
                sizes="100vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 lg:p-12 max-w-xl">
                {item.status && <Badge className="mb-3">{item.status}</Badge>}
                <h1 className="font-heading text-3xl lg:text-5xl text-white tracking-wide leading-tight mb-4 drop-shadow-lg">
                  {item.title}
                </h1>
                <div className="flex items-center gap-3">
                  <Link href={`/drama/${item.id}`}>
                    <Button size="sm" className="gap-2 shadow-glow-sm">
                      <Play className="w-3.5 h-3.5 fill-white" /> Watch Now
                    </Button>
                  </Link>
                  <Link href={`/drama/${item.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Info className="w-3.5 h-3.5" /> Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4 bg-black/50 border-white/10 text-white hover:bg-brand-600 hover:border-brand-500" />
      <CarouselNext className="right-4 bg-black/50 border-white/10 text-white hover:bg-brand-600 hover:border-brand-500" />
    </Carousel>
  );
}

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

async function Trending() {
  const data = await getTrending();
  if (!data.results.length) return <ApiUnavailableRow />;
  return (
    <>
      {data.results.map((drama, i) => (
        <DramaCard key={i}
          data={{ title: drama.title, image: drama.image, description: drama.status ?? "", slug: drama.id }}
          className="w-28 shrink-0 lg:w-[160px]" aspectRatio="portrait" width={160} height={230} />
      ))}
    </>
  );
}

async function WatchList() {
  const watchlists = await getWatchLists();
  const list = watchlists.filter((l) => [null, "watching", "plan_to_watch"].includes(l.status));
  if (!list.length) {
    return (
      <div className="flex items-center gap-3 py-4 px-4 border border-border rounded bg-secondary/20 text-sm text-muted-foreground">
        Your watchlist is empty. Find a drama and add it to start tracking.
      </div>
    );
  }
  return (
    <>
      {list.map(({ series: drama }, i) => drama && (
        <DramaCard key={i}
          data={{ title: drama.title, image: drama.coverImage, description: "", slug: drama.slug.replace("drama-detail/", "") }}
          className="w-28 shrink-0 lg:w-[160px]" aspectRatio="portrait" width={160} height={230} />
      ))}
    </>
  );
}
