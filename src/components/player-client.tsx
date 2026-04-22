"use client";

import { useState, useCallback } from "react";
import { Flame, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from "@/components/icons";
import { VideoPlayerWrapper } from "@/components/video-player-wrapper";

export interface PlayerClientProps {
  embedUrl?: string;
  allEmbeds?: string[];      // all fallback embed URLs
  hlsUrl?: string;
  slug: string;
  dramaId: string;
  number: number;
  seekTo?: number;
}

// ── Ad-blocking proxy ─────────────────────────────────────────────────────────
// Route the embed URL through our own proxy to strip ad scripts
function proxyUrl(src: string): string {
  return `/api/player-proxy?url=${encodeURIComponent(src)}`;
}

// ── Iframe player with fallback chain ─────────────────────────────────────────
function IframePlayer({
  allEmbeds,
  title,
}: {
  allEmbeds: string[];
  title: string;
}) {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  const [adBlocking, setAdBlocking] = useState(true);

  const current = allEmbeds[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < allEmbeds.length - 1;

  const tryNext = useCallback(() => {
    if (hasNext) { setIdx((i) => i + 1); setKey((k) => k + 1); }
  }, [hasNext]);

  const tryPrev = useCallback(() => {
    if (hasPrev) { setIdx((i) => i - 1); setKey((k) => k + 1); }
  }, [hasPrev]);

  const reload = useCallback(() => setKey((k) => k + 1), []);
  const toggleAds = useCallback(() => { setAdBlocking((b) => !b); setKey((k) => k + 1); }, []);

  if (!current) {
    return (
      <div className="size-full bg-[#0a0c12] flex items-center justify-center">
        <div className="text-center space-y-3 px-8">
          <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
          <p className="font-heading text-sm text-white tracking-wider">NO STREAM AVAILABLE</p>
          <p className="text-xs text-muted-foreground max-w-xs">No streaming sources found for this episode.</p>
        </div>
      </div>
    );
  }

  const src = adBlocking ? proxyUrl(current) : current;

  return (
    <div className="relative size-full bg-black flex flex-col">
      {/* Iframe */}
      <iframe
        key={`${key}-${idx}`}
        src={src}
        title={title}
        className="flex-1 w-full border-0 block"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="no-referrer"
      />

      {/* Controls overlay — bottom bar */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 px-3 py-2
        bg-gradient-to-t from-black/90 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-2">
          {/* Server switcher */}
          {allEmbeds.length > 1 && (
            <>
              <button
                disabled={!hasPrev}
                onClick={tryPrev}
                className="p-1 rounded text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                title="Previous server"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-white/60 font-mono">
                Server {idx + 1}/{allEmbeds.length}
              </span>
              <button
                disabled={!hasNext}
                onClick={tryNext}
                className="p-1 rounded text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                title="Next server"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ad-block toggle */}
          <button
            onClick={toggleAds}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
              adBlocking
                ? "border-brand-600/50 bg-brand-950/60 text-brand-300"
                : "border-white/10 bg-black/40 text-white/40"
            }`}
            title={adBlocking ? "Ad filter ON (click to disable)" : "Ad filter OFF (click to enable)"}
          >
            <AlertTriangle className="w-3 h-3" />
            {adBlocking ? "Ads Filtered" : "Ads On"}
          </button>

          {/* Reload */}
          <button
            onClick={reload}
            className="p-1 rounded text-white/60 hover:text-white transition-colors"
            title="Reload player"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── No source ─────────────────────────────────────────────────────────────────
function NoSource() {
  return (
    <div className="size-full bg-[#0a0c12] flex items-center justify-center">
      <div className="text-center space-y-3 px-8">
        <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
        <p className="font-heading text-sm text-white tracking-wider">NO STREAM AVAILABLE</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          No streaming source found for this episode. Try again later.
        </p>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function PlayerClient({
  embedUrl,
  allEmbeds = [],
  hlsUrl,
  slug,
  dramaId,
  number,
  seekTo,
}: PlayerClientProps) {
  // Build full embed list — deduplicated
  const embeds = allEmbeds.length > 0
    ? allEmbeds
    : embedUrl ? [embedUrl] : [];

  if (embeds.length > 0) {
    return <IframePlayer allEmbeds={embeds} title={`${slug} Episode ${number}`} />;
  }
  if (hlsUrl) {
    return <VideoPlayerWrapper url={hlsUrl} slug={slug} dramaId={dramaId} number={number} seekTo={seekTo} />;
  }
  return <NoSource />;
}
