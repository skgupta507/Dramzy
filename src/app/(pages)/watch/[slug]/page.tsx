import { Card } from "@/components/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { PlayerClient } from "@/components/player-client";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getEpisodeInfo, getEpisodeSources, getDramaInfo, getTrending } from "@/lib/dramacool";
import { toSlug } from "@/lib/slug";
import { notify } from "@/lib/webhooks/slack";
import { Info, List, Play, Flame } from "@/components/icons";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense, cache } from "react";
import UpdateWatchlistButton from "./update-progress";

// Next 14: params is a plain object, not a Promise
interface PageProps { params: { slug: string } }

function normaliseRouteSlug(raw: string): string {
  const decoded = decodeURIComponent(raw);
  return decoded.startsWith("http") ? toSlug(decoded) : decoded;
}

const cachedAuth = cache(() => auth());

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const episodeId = normaliseRouteSlug(params.slug);
    const info = await getEpisodeInfo(episodeId);
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
  const episodeId = normaliseRouteSlug(params.slug);

  const [info, sources, session] = await Promise.all([
    getEpisodeInfo(episodeId),
    getEpisodeSources(episodeId),
    cachedAuth(),
  ]);

  const { dramaId, title, number } = info;
  const dramaSlug = dramaId.replace("drama-detail/", "");

  notify(`Watching: ${title} ep ${number}`).catch(() => {});

  const embedUrl = sources?.embedUrl;
  const hlsUrl   = sources?.sources.find((s) => s.isM3U8)?.url ?? sources?.sources[0]?.url;

  let seekTo: number | undefined;
  if (session) {
    const prog = await db.query.progress.findFirst({
      where: (t, { eq, and }) => and(eq(t.episodeSlug, episodeId), eq(t.userId, session.user.id)),
    });
    seekTo = prog ? Number(prog.seconds) : undefined;
  }

  const [dramaResult, trendingResult] = await Promise.allSettled([
    getDramaInfo(dramaSlug),
    getTrending(1),
  ]);
  const dramaInfo     = dramaResult.status === "fulfilled" ? dramaResult.value : null;
  const relatedDramas = (trendingResult.status === "fulfilled" ? trendingResult.value.results : [])
    .filter((r) => r.id !== dramaSlug).slice(0, 12);
  const allEpisodes   = dramaInfo?.episodes ?? [];

  return (
    <div className="min-h-screen bg-[#0f1117]">

      {/* ── Player ───────────────────────────────────────────────────────── */}
      <div className="bg-black">
        <div className="mx-auto max-w-6xl">
          <AspectRatio ratio={16 / 9}>
            <PlayerClient
              embedUrl={embedUrl}
              hlsUrl={hlsUrl}
              slug={episodeId}
              dramaId={dramaId}
              number={number}
              seekTo={seekTo}
            />
          </AspectRatio>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-5 space-y-6">

        {/* Episode meta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/drama/${dramaSlug}`} className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                {title}
              </Link>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <Badge variant="secondary" className="text-xs">Episode {number}</Badge>
              {dramaInfo?.status && (
                <Badge variant={dramaInfo.status === "ongoing" ? "default" : "secondary"} className="text-xs capitalize">
                  {dramaInfo.status}
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-2xl lg:text-3xl text-white tracking-wide">
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
          <div className="flex gap-2 shrink-0">
            {session && (
              <Suspense fallback={null}>
                <WatchlistBtn dramaId={dramaId} episode={number} />
              </Suspense>
            )}
            <Link href={`/drama/${dramaSlug}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Info className="w-3.5 h-3.5" /> Drama Info
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t border-border/30" />

        {/* Episode list */}
        {allEpisodes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-brand-500" />
                <h2 className="font-heading text-lg text-white tracking-wide">All Episodes</h2>
                <span className="text-xs text-muted-foreground">({allEpisodes.length})</span>
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
                    <Link key={ep.id} href={`/watch/${ep.id}`} prefetch={false}
                      className={`shrink-0 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all w-16 ${
                        isCurrent ? "border-brand-500 bg-brand-950/40" : "border-border/40 hover:border-brand-700/50 hover:bg-secondary/40"
                      }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent ? "bg-brand-600 text-white" : "bg-secondary text-muted-foreground"
                      }`}>{ep.episode}</div>
                      <span className={`text-[10px] ${isCurrent ? "text-brand-300 font-medium" : "text-muted-foreground"}`}>
                        EP {ep.episode}
                      </span>
                      {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />}
                    </Link>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        <div className="border-t border-border/30" />

        {/* Drama card */}
        {dramaInfo && (
          <section className="flex flex-col sm:flex-row gap-5 p-5 rounded-xl border border-white/6 bg-secondary/20">
            <div className="shrink-0 mx-auto sm:mx-0">
              <Link href={`/drama/${dramaSlug}`}>
                <div className="w-28 rounded-lg overflow-hidden border border-white/8 hover:border-brand-500/40 transition-colors">
                  <Image src={dramaInfo.image} alt={dramaInfo.title} width={112} height={158}
                    className="w-full object-cover aspect-[3/4]" unoptimized />
                </div>
              </Link>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-heading text-xl text-white tracking-wide">{dramaInfo.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {dramaInfo.releaseDate && <span className="text-xs text-muted-foreground">{dramaInfo.releaseDate}</span>}
                  {dramaInfo.country && <span className="text-xs text-muted-foreground">· {dramaInfo.country}</span>}
                </div>
              </div>
              {dramaInfo.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{dramaInfo.description}</p>
              )}
              {dramaInfo.starring && dramaInfo.starring.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {dramaInfo.starring.slice(0, 6).map((a) => (
                    <span key={a} className="text-xs bg-secondary/60 rounded px-2.5 py-1 text-muted-foreground border border-border/30">{a}</span>
                  ))}
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

        {/* More to Watch */}
        {relatedDramas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl text-white tracking-wide">More to Watch</h2>
              <Link href="/popular" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Browse all →</Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {relatedDramas.map((drama, i) => (
                <Card key={i} data={{ title: drama.title, image: drama.image, description: drama.status ?? "", slug: drama.id }}
                  aspectRatio="portrait" width={140} height={200} className="w-full" />
              ))}
            </div>
          </section>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}

async function WatchlistBtn({ dramaId, episode }: { dramaId: string; episode: number }) {
  const dbInfo = await db.query.series.findFirst({ where: (t, { eq }) => eq(t.slug, dramaId) });
  if (!dbInfo) return null;
  const wl = await db.query.watchList.findFirst({
    where: (t, { eq, and, gte }) => and(gte(t.episode, episode), eq(t.dramaId, dramaId)),
  });
  return <UpdateWatchlistButton size="sm" episode={episode} slug={dramaId} watched={!!wl} />;
}
