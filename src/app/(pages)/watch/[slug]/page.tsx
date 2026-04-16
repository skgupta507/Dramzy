import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, buttonVariants } from "@/components/ui/button";
import { VideoPlayerWrapper } from "@/components/video-player-wrapper";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getEpisodeInfo, getEpisodeSources } from "@/lib/dramacool";
import { toSlug } from "@/lib/slug";
import { notify } from "@/lib/webhooks/slack";
import { ChevronLeft, ChevronRight, Download, Flame, Tv2 } from "lucide-react";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { Suspense, cache } from "react";
import UpdateWatchlistButton from "./update-progress";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const cachedEpisodeInfo = cache(async (slug: string) =>
  getEpisodeInfo(toSlug(decodeURIComponent(slug)))
);
const cachedAuth = cache(async () => await auth());

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const info = await cachedEpisodeInfo(slug);
    const titleText = `${info.title} — Episode ${info.number}`;
    return {
      title: titleText,
      description: `Watch ${info.title} episode ${info.number} on Dramzy.`,
    };
  } catch {
    const { title, description } = await parent;
    return { title, description };
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const info = await cachedEpisodeInfo(slug);
  const { dramaId, title, number } = info;

  notify(`Watching: ${title} ep ${number}`).catch(() => {});

  return (
    <section className="relative min-h-screen">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-950/10 to-transparent pointer-events-none" />

      <div className="relative z-10 mx-auto w-screen px-4 py-6 lg:container lg:py-8 space-y-4">
        {/* Back */}
        <div className="flex items-center justify-between">
          <Link
            href={`/drama/${dramaId.replace("drama-detail/", "")}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Series
          </Link>
          <span className="text-xs text-muted-foreground font-heading tracking-widest hidden sm:block">
            Dramzy
          </span>
        </div>

        {/* Player */}
        <div className="rounded-lg overflow-hidden border border-white/5 bg-black shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <Suspense
            fallback={
              <AspectRatio ratio={16 / 9}>
                <div className="size-full bg-black flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Flame className="w-8 h-8 text-brand-600 animate-flicker mx-auto" strokeWidth={1.5} />
                    <p className="text-xs text-muted-foreground tracking-widest font-heading">
                      LOADING STREAM…
                    </p>
                  </div>
                </div>
              </AspectRatio>
            }
          >
            <PlayerSection episodeSlug={slug} number={number} dramaId={dramaId} />
          </Suspense>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl text-white tracking-wide">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Episode {number}</p>
        </div>

        {/* Controls */}
        <Suspense fallback={null}>
          <ControlButtons episodeSlug={slug} />
        </Suspense>

        <div className="border-t border-border/30 pt-4" />
      </div>
    </section>
  );
}

async function PlayerSection({
  episodeSlug,
  dramaId,
  number,
}: {
  episodeSlug: string;
  dramaId: string;
  number: number;
}) {
  const sources = await getEpisodeSources(toSlug(decodeURIComponent(episodeSlug)));
  const session = await cachedAuth();

  let seekTo: number | undefined;
  if (session) {
    const progress = await db.query.progress.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.episodeSlug, toSlug(decodeURIComponent(episodeSlug))), eq(t.userId, session.user.id)),
    });
    seekTo = progress ? Number(progress.seconds) : undefined;
  }

  const hlsSource = sources?.sources.find((s) => s.isM3U8) ?? sources?.sources[0];

  // No direct source — use embed iframe
  if (!hlsSource && sources?.embedUrl) {
    return (
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={sources.embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media"
          title={`Episode ${number}`}
        />
      </AspectRatio>
    );
  }

  if (!hlsSource) {
    return (
      <AspectRatio ratio={16 / 9}>
        <div className="size-full bg-[#0a0c12] flex items-center justify-center">
          <div className="text-center space-y-3 px-8">
            <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
            <p className="font-heading text-sm text-white tracking-wider">NO STREAM AVAILABLE</p>
            <p className="text-xs text-muted-foreground">
              This episode has no streaming sources yet. Try again later.
            </p>
          </div>
        </div>
      </AspectRatio>
    );
  }

  return (
    <AspectRatio ratio={16 / 9}>
      <VideoPlayerWrapper
        slug={toSlug(decodeURIComponent(episodeSlug))}
        dramaId={dramaId}
        number={number}
        seekTo={seekTo}
        url={hlsSource.url}
      />
    </AspectRatio>
  );
}

async function ControlButtons({ episodeSlug }: { episodeSlug: string }) {
  const info = await cachedEpisodeInfo(episodeSlug);
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

  const dramaInfo = await db.query.series.findFirst({
    where: (t, { eq }) => eq(t.slug, dramaId),
  });

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button size="sm" variant="outline" disabled={!episodes.previous} asChild={!!episodes.previous}>
        {episodes.previous ? (
          <Link href={`/watch/${episodes.previous}`} scroll={false}>
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </Link>
        ) : (
          <span><ChevronLeft className="w-3.5 h-3.5" /> Previous</span>
        )}
      </Button>

      <Button size="sm" variant="secondary" className="gap-1.5 pointer-events-none">
        <Tv2 className="w-3.5 h-3.5 text-brand-500" />
        <span className="font-heading text-xs tracking-wide">EP {number}</span>
      </Button>

      <Button size="sm" variant="outline" disabled={!episodes.next} asChild={!!episodes.next}>
        {episodes.next ? (
          <Link href={`/watch/${episodes.next}`} scroll={false}>
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span>Next <ChevronRight className="w-3.5 h-3.5" /></span>
        )}
      </Button>

      {downloadLink && (
        <Button size="sm" variant="ghost" asChild>
          <Link href={downloadLink} download className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download
          </Link>
        </Button>
      )}

      {session && dramaInfo && (
        <UpdateWatchlistButton size="sm" episode={number} slug={dramaId} watched={watched} />
      )}
    </div>
  );
}
