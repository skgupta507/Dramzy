import { Card } from "@/components/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WatchPlayer } from "./watch-player";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getEpisodeInfo, getDramaInfo, getTrending } from "@/lib/dramacool";
import { toSlug } from "@/lib/slug";
import { notify } from "@/lib/webhooks/slack";
import { Info, List, Play } from "@/components/icons";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense, cache } from "react";
import UpdateWatchlistButton from "./update-progress";

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

  const [info, session] = await Promise.all([
    getEpisodeInfo(episodeId),
    cachedAuth(),
  ]);

  const { dramaId, title, number } = info;
  const dramaSlug = dramaId.replace("drama-detail/", "");

  notify(`Watching: ${title} ep ${number}`).catch(() => {});

  const [dramaResult, trendingResult] = await Promise.allSettled([
    getDramaInfo(dramaSlug),
    getTrending(1),
  ]);
  const dramaInfo = dramaResult.status === "fulfilled" ? dramaResult.value : null;
  const relatedDramas = (
    trendingResult.status === "fulfilled" ? trendingResult.value.results : []
  ).filter(r => r.id !== dramaSlug).slice(0, 12);
  const allEpisodes = dramaInfo?.episodes ?? [];

  return (
    <div className="min-h-screen bg-[#0f1117]">

      {/* ── Player strip — full bleed black, player inside ───────────────── */}
      <div className="w-full bg-black border-b border-white/5">
        {/* Same container as the rest of the site */}
        <div className="mx-auto w-full lg:container">
          <WatchPlayer episodeId={episodeId} />
        </div>
      </div>

      {/* ── Content — identical container/padding to every other page ───── */}
      <div className="mx-auto w-screen px-4 py-8 lg:container lg:py-10 space-y-10">

        {/* Episode meta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-xs text-white/40">
              <Link
                href={`/drama/${dramaSlug}`}
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors truncate max-w-[200px]"
              >
                {title}
              </Link>
              <span>·</span>
              <Badge variant="secondary" className="text-xs">Episode {number}</Badge>
              {dramaInfo?.status && (
                <Badge
                  variant={dramaInfo.status === "ongoing" ? "default" : "secondary"}
                  className="text-xs capitalize"
                >
                  {dramaInfo.status}
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-2xl lg:text-3xl text-white tracking-wide leading-tight">
              {title} <span className="text-brand-400">Ep {number}</span>
            </h1>
            {dramaInfo?.genres && dramaInfo.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {dramaInfo.genres.slice(0, 5).map(g => (
                  <span key={g} className="text-[11px] text-white/30 bg-white/5 rounded px-2 py-0.5">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        <div className="border-t border-white/5" />

        {/* Episode list */}
        {allEpisodes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-brand-500" />
                <h2 className="font-heading text-lg text-white tracking-wide">All Episodes</h2>
                <span className="text-xs text-white/30">({allEpisodes.length})</span>
              </div>
              <Link
                href={`/drama/${dramaSlug}`}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Drama page →
              </Link>
            </div>
            <ScrollArea>
              <div className="flex gap-2 pb-3">
                {allEpisodes.map(ep => {
                  const isCurrent = ep.episode === number;
                  return (
                    <Link
                      key={ep.id}
                      href={`/watch/${ep.id}`}
                      prefetch={false}
                      className={`shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all w-[58px] ${
                        isCurrent
                          ? "border-brand-500 bg-brand-950/50"
                          : "border-white/8 hover:border-brand-700/50 hover:bg-white/3"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isCurrent ? "bg-brand-600 text-white" : "bg-white/8 text-white/50"
                      }`}>
                        {ep.episode}
                      </div>
                      <span className={`text-[9px] leading-tight ${
                        isCurrent ? "text-brand-300 font-medium" : "text-white/30"
                      }`}>
                        EP {ep.episode}
                      </span>
                      {isCurrent && (
                        <div className="w-1 h-1 rounded-full bg-brand-500 animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        <div className="border-t border-white/5" />

        {/* Drama info card */}
        {dramaInfo && (
          <section className="flex flex-col sm:flex-row gap-6 p-5 rounded-xl border border-white/6 bg-white/[0.02]">
            <div className="shrink-0 mx-auto sm:mx-0">
              <Link href={`/drama/${dramaSlug}`}>
                <div className="w-28 rounded-lg overflow-hidden border border-white/8 hover:border-brand-500/40 transition-colors">
                  <Image
                    src={dramaInfo.image}
                    alt={dramaInfo.title}
                    width={112} height={158}
                    className="w-full object-cover aspect-[3/4]"
                    unoptimized
                  />
                </div>
              </Link>
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <h3 className="font-heading text-xl text-white tracking-wide">{dramaInfo.title}</h3>
                <p className="text-xs text-white/30 mt-1 flex gap-2 flex-wrap">
                  {dramaInfo.releaseDate && <span>{dramaInfo.releaseDate}</span>}
                  {dramaInfo.country && <span>· {dramaInfo.country}</span>}
                </p>
              </div>
              {dramaInfo.description && (
                <p className="text-sm text-white/50 leading-relaxed line-clamp-3">
                  {dramaInfo.description}
                </p>
              )}
              {dramaInfo.starring && dramaInfo.starring.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {dramaInfo.starring.slice(0, 6).map(a => (
                    <span key={a} className="text-[11px] bg-white/5 rounded px-2 py-0.5 text-white/40 border border-white/8">
                      {a}
                    </span>
                  ))}
                </div>
              )}
              <Link href={`/drama/${dramaSlug}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Play className="w-3 h-3 fill-current" /> View Full Drama
                </Button>
              </Link>
            </div>
          </section>
        )}

        <div className="border-t border-white/5" />

        {/* Related dramas */}
        {relatedDramas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
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
                  aspectRatio="portrait" width={140} height={200} className="w-full"
                />
              ))}
            </div>
          </section>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

async function WatchlistBtn({ dramaId, episode }: { dramaId: string; episode: number }) {
  const dbInfo = await db.query.series.findFirst({
    where: (t, { eq }) => eq(t.slug, dramaId),
  });
  if (!dbInfo) return null;
  const wl = await db.query.watchList.findFirst({
    where: (t, { eq, and, gte }) => and(gte(t.episode, episode), eq(t.dramaId, dramaId)),
  });
  return <UpdateWatchlistButton size="sm" episode={episode} slug={dramaId} watched={!!wl} />;
}
