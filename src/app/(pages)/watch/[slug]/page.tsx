import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/card";
import { VideoPlayerWrapper } from "@/components/video-player-wrapper";
import { EmbedPlayer } from "@/components/embed-player";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getEpisodeInfo, getEpisodeSources, getDramaInfo, getTrending } from "@/lib/dramacool";
import { toSlug } from "@/lib/slug";
import { notify } from "@/lib/webhooks/slack";
import {
  ChevronLeft, ChevronRight, Download, Flame, Tv2,
  BookmarkPlus, Star, List, Share2, Info, Play,
} from "lucide-react";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense, cache } from "react";
import UpdateWatchlistButton from "./update-progress";

interface PageProps { params: Promise<{ slug: string }> }

function normaliseRouteSlug(raw: string): string {
  const decoded = decodeURIComponent(raw);
  return decoded.startsWith("http") ? toSlug(decoded) : decoded;
}

const cachedEpisodeInfo = cache((slug: string) => getEpisodeInfo(slug));
const cachedAuth = cache(() => auth());

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const info = await cachedEpisodeInfo(normaliseRouteSlug(slug));
    return {
      title: `${info.title} — Episode ${info.number}`,
      description: `Watch ${info.title} episode ${info.number} on Dramzy.`,
    };
  } catch {
    const { title, description } = await parent;
    return { title, description };
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const episodeId = normaliseRouteSlug(slug);
  const info = await cachedEpisodeInfo(episodeId);
  const { dramaId, title, number } = info;
  const dramaSlug = dramaId.replace("drama-detail/", "");

  notify(`Watching: ${title} ep ${number}`).catch(() => {});

  // Fetch drama info and related dramas in parallel
  const [drama, trending] = await Promise.allSettled([
    getDramaInfo(dramaSlug),
    getTrending(1),
  ]);
  const dramaInfo = drama.status === "fulfilled" ? drama.value : null;
  const relatedDramas = (trending.status === "fulfilled" ? trending.value.results : [])
    .filter((r) => r.id !== dramaSlug)
    .slice(0, 12);
  const allEpisodes = dramaInfo?.episodes ?? [];

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* ── Player zone (full-width dark) ──────────────────────────────────── */}
      <div className="bg-black">
        <div className="mx-auto max-w-6xl">
          <Suspense
            fallback={
              <AspectRatio ratio={16 / 9}>
                <div className="size-full bg-black flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Flame className="w-8 h-8 text-brand-600 animate-flicker mx-auto" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground tracking-widest font-heading">LOADING STREAM…</p>
                  </div>
                </div>
              </AspectRatio>
            }
          >
            <PlayerSection episodeId={episodeId} number={number} dramaId={dramaId} />
          </Suspense>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-5 space-y-6">

        {/* Episode title + meta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/drama/${dramaSlug}`} className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                {title}
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Badge variant="secondary" className="text-xs">Episode {number}</Badge>
              {dramaInfo?.status && (
                <Badge variant={dramaInfo.status === "ongoing" ? "default" : "secondary"} className="text-xs capitalize">
                  {dramaInfo.status}
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-2xl lg:text-3xl text-white tracking-wide leading-tight">
              {title} <span className="text-brand-400">Ep {number}</span>
            </h1>
            {dramaInfo?.genres && (
              <div className="flex flex-wrap gap-1.5">
                {dramaInfo.genres.slice(0, 4).map((g) => (
                  <span key={g} className="text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-0.5">{g}</span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Suspense fallback={null}>
              <WatchlistAction dramaId={dramaId} episode={number} />
            </Suspense>
            <Link href={`/drama/${dramaSlug}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Info className="w-3.5 h-3.5" /> Drama Info
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Episode navigation controls ─────────────────────────────────── */}
        <Suspense fallback={null}>
          <ControlButtons episodeId={episodeId} />
        </Suspense>

        <div className="border-t border-border/30" />

        {/* ── Episode list for this drama ─────────────────────────────────── */}
        {allEpisodes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-brand-500" />
                <h2 className="font-heading text-lg text-white tracking-wide">All Episodes</h2>
                <span className="text-xs text-muted-foreground">({allEpisodes.length} total)</span>
              </div>
              <Link href={`/drama/${dramaSlug}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                Drama page →
              </Link>
            </div>
            <ScrollArea>
              <div className="flex gap-2.5 pb-3">
                {allEpisodes.map((ep) => {
                  const isCurrent = ep.episode === number;
                  return (
                    <Link
                      key={ep.id}
                      href={`/watch/${ep.id}`}
                      prefetch={false}
                      className={`shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all w-16 ${
                        isCurrent
                          ? "border-brand-500 bg-brand-950/40 shadow-glow-sm"
                          : "border-border/40 hover:border-brand-700/50 hover:bg-secondary/40"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent ? "bg-brand-600 text-white" : "bg-secondary text-muted-foreground"
                      }`}>
                        {ep.episode}
                      </div>
                      <span className={`text-[10px] text-center leading-tight ${
                        isCurrent ? "text-brand-300 font-medium" : "text-muted-foreground"
                      }`}>
                        EP {ep.episode}
                      </span>
                      {isCurrent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        <div className="border-t border-border/30" />

        {/* ── Drama info card ─────────────────────────────────────────────── */}
        {dramaInfo && (
          <section className="flex flex-col sm:flex-row gap-5 p-5 rounded-xl border border-white/6 bg-secondary/20">
            {/* Poster */}
            <div className="shrink-0 mx-auto sm:mx-0">
              <Link href={`/drama/${dramaSlug}`}>
                <div className="w-28 rounded-lg overflow-hidden border border-white/8 hover:border-brand-500/40 transition-colors">
                  <Image
                    src={dramaInfo.image}
                    alt={dramaInfo.title}
                    width={112}
                    height={158}
                    className="w-full object-cover aspect-[3/4]"
                    unoptimized
                  />
                </div>
              </Link>
            </div>
            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-heading text-xl text-white tracking-wide">{dramaInfo.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {dramaInfo.releaseDate && (
                    <span className="text-xs text-muted-foreground">{dramaInfo.releaseDate}</span>
                  )}
                  {dramaInfo.country && (
                    <span className="text-xs text-muted-foreground">· {dramaInfo.country}</span>
                  )}
                  {dramaInfo.rating && (
                    <span className="text-xs text-muted-foreground">· {dramaInfo.rating}</span>
                  )}
                </div>
              </div>
              {dramaInfo.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {dramaInfo.description}
                </p>
              )}
              {dramaInfo.starring && dramaInfo.starring.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground/60 mb-1.5 font-medium uppercase tracking-wider">Starring</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dramaInfo.starring.slice(0, 6).map((actor) => (
                      <span key={actor} className="text-xs bg-secondary/60 rounded px-2.5 py-1 text-muted-foreground border border-border/30">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Link href={`/drama/${dramaSlug}`}>
                <Button variant="outline" size="sm" className="gap-1.5 mt-1">
                  <Play className="w-3 h-3 fill-current" /> View Full Drama
                </Button>
              </Link>
            </div>
          </section>
        )}

        <div className="border-t border-border/30" />

        {/* ── More to Watch ───────────────────────────────────────────────── */}
        {relatedDramas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-white tracking-wide">More to Watch</h2>
              <Link href="/popular" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                Browse all →
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {relatedDramas.map((drama, i) => (
                <Card
                  key={i}
                  data={{ title: drama.title, image: drama.image, description: drama.status ?? "", slug: drama.id }}
                  aspectRatio="portrait"
                  width={140}
                  height={200}
                  className="w-full"
                />
              ))}
            </div>
          </section>
        )}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// ── Player Section ────────────────────────────────────────────────────────────

async function PlayerSection({
  episodeId,
  dramaId,
  number,
}: {
  episodeId: string;
  dramaId: string;
  number: number;
}) {
  const [sources, session] = await Promise.all([
    getEpisodeSources(episodeId),
    cachedAuth(),
  ]);

  let seekTo: number | undefined;
  if (session) {
    const progress = await db.query.progress.findFirst({
      where: (t, { eq, and }) => and(eq(t.episodeSlug, episodeId), eq(t.userId, session.user.id)),
    });
    seekTo = progress ? Number(progress.seconds) : undefined;
  }

  const embedUrl = sources?.embedUrl;
  const hlsSource = sources?.sources.find((s) => s.isM3U8) ?? sources?.sources[0];

  // Embed iframe is most compatible for DramaCool streams
  if (embedUrl) {
    return (
      <AspectRatio ratio={16 / 9}>
        <EmbedPlayer src={embedUrl} title={`Episode ${number}`} />
      </AspectRatio>
    );
  }

  // Fallback: direct HLS
  if (hlsSource) {
    return (
      <AspectRatio ratio={16 / 9}>
        <VideoPlayerWrapper
          slug={episodeId}
          dramaId={dramaId}
          number={number}
          seekTo={seekTo}
          url={hlsSource.url}
        />
      </AspectRatio>
    );
  }

  return (
    <AspectRatio ratio={16 / 9}>
      <div className="size-full bg-[#0a0c12] flex items-center justify-center">
        <div className="text-center space-y-3 px-8">
          <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
          <p className="font-heading text-sm text-white tracking-wider">NO STREAM AVAILABLE</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            No streaming source found for this episode. Try again later.
          </p>
        </div>
      </div>
    </AspectRatio>
  );
}

// ── Control Buttons ───────────────────────────────────────────────────────────

async function ControlButtons({ episodeId }: { episodeId: string }) {
  const info = await cachedEpisodeInfo(episodeId);
  const { episodes, number, downloadLink, dramaId } = info;
  const session = await cachedAuth();

  let watched = false;
  if (session) {
    const wl = await db.query.watchList.findFirst({
      where: (t, { eq, and, gte }) =>
        and(gte(t.episode, number), eq(t.dramaId, dramaId), eq(t.userId, session.user.id)),
    });
    watched = !!wl;
  }

  const dramaDbInfo = await db.query.series.findFirst({
    where: (t, { eq }) => eq(t.slug, dramaId),
  });

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button size="sm" variant="outline" disabled={!episodes.previous} asChild={!!episodes.previous}>
        {episodes.previous
          ? <Link href={`/watch/${episodes.previous}`} scroll={false} className="flex items-center gap-1.5">
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Link>
          : <span className="flex items-center gap-1.5"><ChevronLeft className="w-3.5 h-3.5" /> Previous</span>}
      </Button>

      <Button size="sm" variant="secondary" className="gap-1.5 pointer-events-none font-heading tracking-wide">
        <Tv2 className="w-3.5 h-3.5 text-brand-500" /> EP {number}
      </Button>

      <Button size="sm" variant="outline" disabled={!episodes.next} asChild={!!episodes.next}>
        {episodes.next
          ? <Link href={`/watch/${episodes.next}`} scroll={false} className="flex items-center gap-1.5">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          : <span className="flex items-center gap-1.5">Next <ChevronRight className="w-3.5 h-3.5" /></span>}
      </Button>

      {downloadLink && (
        <Button size="sm" variant="ghost" asChild>
          <Link href={downloadLink} download className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download
          </Link>
        </Button>
      )}

      {session && dramaDbInfo && (
        <UpdateWatchlistButton size="sm" episode={number} slug={dramaId} watched={watched} />
      )}
    </div>
  );
}

// ── Watchlist Action ──────────────────────────────────────────────────────────

async function WatchlistAction({ dramaId, episode }: { dramaId: string; episode: number }) {
  const session = await cachedAuth();
  if (!session) return null;

  const dbInfo = await db.query.series.findFirst({
    where: (t, { eq }) => eq(t.slug, dramaId),
  });
  if (!dbInfo) return null;

  return (
    <UpdateWatchlistButton
      size="sm"
      episode={episode}
      slug={dramaId}
      watched={false}
      variant="outline"
    />
  );
}
