import { Card } from "@/components/card";
import { Loading } from "@/components/fallbacks/loading";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { db } from "@/db";
import { episode, series, watchList } from "@/db/schema/main";
import { auth } from "@/lib/auth";
import { getDramaInfo, getTrending } from "@/lib/dramacool";
import {
  existingFromDatabase,
  getWatchLists,
  popFromWatchList,
  pushToWatchList,
} from "@/lib/helpers/server";
import { cn } from "@/lib/utils";
import { toSlug } from "@/lib/slug";
import { and, asc, eq } from "drizzle-orm";
import {
  Flame, Play, BookmarkPlus, BookmarkMinus,
  Calendar, Film, Star, Globe, Clock, ChevronRight, Tv2,
} from "lucide-react";
import type { Metadata, ResolvingMetadata } from "next";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { Suspense, cache } from "react";
import { SubmitButton } from "./client";

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps, parent: ResolvingMetadata): Promise<Metadata> {
  try {
    const { slug } = await params;
    const drama = await getDramaInfo(toSlug(decodeURIComponent(slug)));
    if (!drama) throw new Error();
    return {
      title: drama.title,
      description: drama.description?.slice(0, 160) || `Watch ${drama.title} on Dramzy.`,
      openGraph: { images: [drama.image] },
    };
  } catch {
    const { title, description } = await parent;
    return { title, description };
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const drama = await getDramaInfo(toSlug(decodeURIComponent(slug)));
  if (!drama) throw new Error("Drama not found");

  const { description, episodes, id, image, otherNames, releaseDate, title, genres, status, country, starring, duration, rating, trailer } = drama;

  // Fetch related dramas for the "More Like This" section
  const related = await getTrending(1);
  const relatedDramas = related.results.filter((r) => r.id !== id).slice(0, 8);

  return (
    <section className="relative min-h-screen">
      {/* Cinematic backdrop */}
      <div className="absolute inset-x-0 top-0 h-[480px] overflow-hidden pointer-events-none">
        <Image src={image} alt={title} fill className="object-cover object-top brightness-30" priority unoptimized />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f1117]/80 to-[#0f1117]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117]/60 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-screen px-4 pt-8 pb-16 lg:container lg:pt-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-xs text-muted-foreground">
          <Link href="/home" className="hover:text-brand-400 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/popular" className="hover:text-brand-400 transition-colors">Dramas</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground/70 truncate max-w-[200px]">{title}</span>
        </nav>

        {/* Main hero row */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Poster */}
          <div className="shrink-0 mx-auto lg:mx-0">
            <div className="w-52 lg:w-60 rounded-lg overflow-hidden border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
              <Image src={image} alt={title} width={240} height={340} className="w-full object-cover aspect-[3/4]" unoptimized />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-5">
            {/* Status + genres */}
            <div className="flex flex-wrap items-center gap-2">
              {status && (
                <Badge variant={status === "ongoing" ? "default" : "secondary"} className="capitalize text-xs">
                  {status === "ongoing" ? "🔴 " : ""}{status}
                </Badge>
              )}
              {genres?.slice(0, 4).map((g, i) => (
                <Badge key={i} variant="genre">{g}</Badge>
              ))}
            </div>

            <h1 className="font-heading text-4xl lg:text-6xl text-white leading-none tracking-wide">
              {title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {releaseDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-500" /> {releaseDate}
                </span>
              )}
              {episodes && episodes.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-brand-500" /> {episodes.length} Episodes
                </span>
              )}
              {country && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5 text-brand-500" /> {country}
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-brand-500" /> {duration}
                </span>
              )}
              {rating && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Star className="w-3.5 h-3.5 text-brand-500" /> {rating}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-base text-white/65 leading-relaxed max-w-2xl">
                {description.length > 400 ? description.slice(0, 400) + "…" : description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {episodes && episodes.length > 0 && (
                <Suspense fallback={<Button disabled className="gap-2"><Loading /> Loading…</Button>}>
                  <LastPlayedEpisode slug={slug} episodes={episodes} />
                </Suspense>
              )}
              <Suspense fallback={<Button variant="outline" disabled><Loading /></Button>}>
                <WatchListed dramaId={id} title={title} />
              </Suspense>
              <Suspense>
                <AdminAction slug={slug} drama={drama} />
              </Suspense>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 pt-2 border-t border-white/8">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{episodes?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Episodes</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white capitalize">{status ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{releaseDate ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Year</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{genres?.[0] ?? "Drama"}</p>
                <p className="text-xs text-muted-foreground">Genre</p>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes */}
        {episodes && episodes.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl text-white tracking-wide">Episodes</h2>
              <span className="text-xs text-muted-foreground">{episodes.length} total</span>
            </div>
            <ScrollArea>
              <div className="flex gap-3 pb-4">
                {episodes.map((ep, i) => (
                  <Card key={i} prefetch={false}
                    data={{
                      title: ep.title,
                      image: image,
                      description: `Ep ${ep.episode}${ep.releaseDate ? " · " + ep.releaseDate : ""}`,
                      link: `/watch/${ep.id}`,
                    }}
                    className="w-32 shrink-0 lg:w-[160px]"
                    aspectRatio="square" width={160} height={160}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Genre tags */}
        {genres && genres.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading text-xl text-white tracking-wide mb-3">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {genres.map((g, i) => (
                <Badge key={i} variant="genre" className="px-3 py-1 text-sm cursor-pointer hover:bg-brand-900/30">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Other names */}
        {otherNames && otherNames.length > 0 && (
          <div className="mb-10 p-5 rounded-lg bg-secondary/30 border border-white/6">
            <h2 className="font-heading text-lg text-white tracking-wide mb-3">Also Known As</h2>
            <div className="flex flex-wrap gap-2">
              {otherNames.map((name, i) => (
                <span key={i} className="text-sm text-muted-foreground bg-secondary/60 rounded px-3 py-1">{name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {starring && starring.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading text-xl text-white tracking-wide mb-3">Starring</h2>
            <div className="flex flex-wrap gap-2">
              {starring.map((actor, i) => (
                <span key={i} className="text-sm text-muted-foreground bg-secondary/60 rounded px-3 py-1 border border-border/40 hover:border-brand-700/40 hover:text-brand-300 transition-colors cursor-default">
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trailer */}
        {trailer && (
          <div className="mb-10">
            <h2 className="font-heading text-xl text-white tracking-wide mb-3">Trailer</h2>
            <div className="rounded-lg overflow-hidden border border-white/5 bg-black" style={{ aspectRatio: "16/9", maxWidth: "640px" }}>
              <iframe src={trailer} className="w-full h-full border-0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={`${title} Trailer`} />
            </div>
          </div>
        )}

        {/* More Like This */}
        {relatedDramas.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-2xl text-white tracking-wide">More Like This</h2>
              <Link href="/popular" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {relatedDramas.map((r, i) => (
                <Card key={i} data={{ title: r.title, image: r.image, description: "", slug: r.id }}
                  aspectRatio="portrait" width={120} height={170} className="w-full" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

async function WatchListed({ dramaId, title }: { dramaId: string; title: string }) {
  const watchLists = await getWatchLists();
  const slug = dramaId.startsWith("drama-detail/") ? dramaId : `drama-detail/${dramaId}`;
  const [_, existsInDb] = await existingFromDatabase(slug);
  if (!existsInDb) return (
    <p className="text-xs text-muted-foreground border border-border rounded px-3 py-2">
      Not yet in database — sync required.
    </p>
  );
  const found = watchLists.find((l) => l.dramaId === slug);
  const isWatchlisted = found?.dramaId === slug;
  if (found?.status === "finished") return (
    <Button variant="secondary" disabled className="gap-2">
      <Icons.check className="size-4" /> Completed
    </Button>
  );
  return (
    <form action={async () => {
      "use server";
      if (isWatchlisted) await popFromWatchList({ slug });
      else await pushToWatchList({ slug });
      revalidatePath(`/drama/${dramaId}`);
    }}>
      <SubmitButton variant={isWatchlisted ? "outline" : "secondary"} className="gap-2 min-w-[160px]">
        {isWatchlisted
          ? <><BookmarkMinus className="size-4" /> Remove</>
          : <><BookmarkPlus className="size-4" /> Add to Watchlist</>}
      </SubmitButton>
    </form>
  );
}

async function AdminAction({ slug, drama }: { slug: string; drama: NonNullable<Awaited<ReturnType<typeof getDramaInfo>>> }) {
  const dbSlug = `drama-detail/${slug}`;
  const sess = await userSession();
  const [results, existsInDb] = await existingFromDatabase(dbSlug);
  if (sess?.user.email !== "noelrohi59@gmail.com") return null;
  const seriesStatus = existsInDb && !results?.description ? "not_upserted" : results?.description ? "upserted" : "not_exists";
  return (
    <form className="inline-flex" action={async (_: FormData) => {
      "use server";
      try {
        const values: typeof series.$inferInsert = {
          coverImage: drama.image, slug: dbSlug, title: drama.title,
          description: drama.description, releaseDate: String(drama.releaseDate ?? ""),
          status: drama.status, genres: drama.genres, otherNames: drama.otherNames,
        };
        const episodeCount = drama.episodes?.length ?? 0;
        const episodes: (typeof episode.$inferInsert)[] = drama.episodes?.map((ep) => ({
          dramaId: dbSlug, episodeSlug: ep.id, number: ep.episode, title: ep.title,
          isLast: ep.episode === episodeCount && drama.status === "completed", subType: ep.subType,
        })) ?? [];
        await db.insert(series).values(values).onConflictDoUpdate({ target: [series.slug], set: { ...values } });
        if (episodes.length > 0) {
          await db.delete(episode).where(eq(episode.dramaId, dbSlug));
          await db.insert(episode).values(episodes);
        }
        revalidatePath(`/drama/${slug}`);
      } catch (err) { console.error(err); }
    }}>
      <SubmitButton variant={seriesStatus === "upserted" ? "destructive" : "secondary"} size="sm">
        {seriesStatus === "not_upserted" ? "Upsert" : seriesStatus === "upserted" ? "Re-sync" : <><Icons.plus className="size-3" /> Add to DB</>}
      </SubmitButton>
    </form>
  );
}

async function LastPlayedEpisode({ slug, episodes }: { slug: string; episodes: { id: string; episode: number; episodeSlug?: string }[] }) {
  const authSession = await userSession();
  if (!authSession) {
    // For guests: just link to first episode
    const first = episodes[0];
    if (!first) return null;
    return (
      <Link href={`/watch/${first.id}`} className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
        <Play className="w-4 h-4 fill-white" /> Watch Episode 1
      </Link>
    );
  }
  const dbSlug = `drama-detail/${slug}`;
  const watchlistData = await db.query.watchList.findFirst({
    where: and(eq(watchList.dramaId, dbSlug), eq(watchList.userId, authSession.user.id)),
    with: {
      series: {
        columns: { id: true },
        with: { episodes: { columns: { episodeSlug: true, number: true }, orderBy: [asc(episode.number)] } },
      },
    },
  });
  const dbEps = watchlistData?.series?.episodes ?? [];
  const idx = dbEps.findIndex((e) => e.number === watchlistData?.episode);
  const next = dbEps[idx + 1] ?? dbEps[0];
  const epNumber = next?.number ?? 1;
  // Fall back to the episode list from API if DB has no data
  const targetId = next?.episodeSlug ?? episodes.find((e) => e.episode === epNumber)?.id ?? episodes[0]?.id;
  return (
    <Link href={targetId ? `/watch/${targetId}` : "#"} className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
      <Play className="w-4 h-4 fill-white" />
      {epNumber === 1 ? "Watch Episode 1" : `Continue · Ep ${epNumber}`}
    </Link>
  );
}

const userSession = cache(async () => await auth());
