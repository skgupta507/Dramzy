"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Flame, RefreshCw } from "@/components/icons";
import { VideoPlayerWrapper } from "@/components/video-player-wrapper";

export interface PlayerClientProps {
  embedUrl?: string;
  hlsUrl?: string;
  slug: string;
  dramaId: string;
  number: number;
  seekTo?: number;
}

function IframePlayer({ src, title }: { src: string; title: string }) {
  const [key, setKey] = useState(0);
  const [errored, setErrored] = useState(false);
  const retry = useCallback(() => { setErrored(false); setKey((k) => k + 1); }, []);

  if (errored) {
    return (
      <div className="size-full bg-black flex items-center justify-center">
        <div className="text-center space-y-4 px-8">
          <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
          <p className="font-heading text-sm text-white tracking-wider">PLAYER ERROR</p>
          <p className="text-xs text-muted-foreground max-w-xs">Failed to load. Try disabling your ad blocker.</p>
          <button onClick={retry} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-white/20 rounded text-white hover:bg-white/10 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <iframe
      key={key}
      src={src}
      title={title}
      className="w-full h-full border-0 block bg-black"
      allowFullScreen
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
      referrerPolicy="no-referrer"
    />
  );
}

function NoSource() {
  return (
    <div className="size-full bg-[#0a0c12] flex items-center justify-center">
      <div className="text-center space-y-3 px-8">
        <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
        <p className="font-heading text-sm text-white tracking-wider">NO STREAM AVAILABLE</p>
        <p className="text-xs text-muted-foreground max-w-xs">No streaming source found. Try again later.</p>
      </div>
    </div>
  );
}

export function PlayerClient({ embedUrl, hlsUrl, slug, dramaId, number, seekTo }: PlayerClientProps) {
  if (embedUrl) return <IframePlayer src={embedUrl} title={`Episode ${number}`} />;
  if (hlsUrl)   return <VideoPlayerWrapper url={hlsUrl} slug={slug} dramaId={dramaId} number={number} seekTo={seekTo} />;
  return <NoSource />;
}
