"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Flame, ChevronLeft, ChevronRight, RefreshCw } from "@/components/icons";
import Link from "next/link";

// Available streaming sources — DramaCool is always first (default)
const SOURCES = [
  { id: "dramacool",  label: "DramaCool",  flag: "🎬" },
  { id: "myasiantv",  label: "MyAsianTV",  flag: "🇦🇸" },
  { id: "kisskh",     label: "KissKH",     flag: "🎭" },
  { id: "kissasian",  label: "KissAsian",  flag: "💋" },
  { id: "viewasian",  label: "ViewAsian",  flag: "👁️" },
] as const;

type SourceId = typeof SOURCES[number]["id"];

interface StreamData {
  source:    string;
  embedUrl:  string | null;
  allEmbeds: string[];
  hlsUrl:    string | null;
  title:     string | null;
  number:    number | null;
  next:      string | null;
  prev:      string | null;
  error?:    string;
}

// ── Iframe player with embed fallback chain ────────────────────────────────────
function IframePlayer({ allEmbeds, title }: { allEmbeds: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);

  const current = allEmbeds[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < allEmbeds.length - 1;

  if (!current) return (
    <div className="size-full bg-[#0a0c12] flex items-center justify-center">
      <div className="text-center space-y-3 px-8">
        <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
        <p className="text-sm text-white font-semibold tracking-wider">NO STREAM</p>
        <p className="text-xs text-muted-foreground">Try a different source above.</p>
      </div>
    </div>
  );

  return (
    <div className="relative size-full bg-black flex flex-col">
      <iframe
        key={`${key}-${idx}`}
        src={`/api/player-proxy?url=${encodeURIComponent(current)}`}
        title={title}
        className="flex-1 w-full border-0 block"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="no-referrer"
      />
      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 px-3 py-2
        bg-gradient-to-t from-black/90 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-2">
          {allEmbeds.length > 1 && (
            <>
              <button disabled={!hasPrev} onClick={() => setIdx(i => i - 1)} className="p-1 rounded text-white/60 hover:text-white disabled:opacity-30">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-white/60 font-mono">Server {idx + 1}/{allEmbeds.length}</span>
              <button disabled={!hasNext} onClick={() => setIdx(i => i + 1)} className="p-1 rounded text-white/60 hover:text-white disabled:opacity-30">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        <button onClick={() => setKey(k => k + 1)} className="p-1 rounded text-white/60 hover:text-white" title="Reload">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── HLS player ─────────────────────────────────────────────────────────────────
function HlsPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url; setReady(true); return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.7/hls.min.js";
    s.onload = () => {
      const Hls = (window as any).Hls;
      if (Hls?.isSupported()) {
        const hls = new Hls(); hls.loadSource(url); hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => setReady(true));
      }
    };
    document.head.appendChild(s);
  }, [url]);

  return (
    <div className="size-full bg-black relative">
      {!ready && <div className="absolute inset-0 flex items-center justify-center"><Flame className="w-8 h-8 text-brand-600 animate-pulse mx-auto" strokeWidth={1.5} /></div>}
      <video ref={videoRef} className="w-full h-full" controls playsInline style={{ display: ready ? "block" : "none" }} />
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function Loading({ source }: { source: string }) {
  return (
    <div className="size-full bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <Flame className="w-8 h-8 text-brand-600 animate-pulse mx-auto" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground tracking-widest">
          Loading from {SOURCES.find(s => s.id === source)?.label ?? source}…
        </p>
      </div>
    </div>
  );
}

// ── Main WatchPlayer ───────────────────────────────────────────────────────────
export function WatchPlayer({ episodeId }: { episodeId: string }) {
  const [activeSource, setActiveSource] = useState<SourceId>("dramacool");
  const [data, setData]     = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback((source: SourceId) => {
    setLoading(true);
    setError(null);
    setData(null);
    setActiveSource(source);
    fetch(`/api/stream?id=${encodeURIComponent(episodeId)}&source=${source}`)
      .then(r => r.json())
      .then((d: StreamData) => {
        setData(d);
        setLoading(false);
        if (d.error) setError(d.error);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [episodeId]);

  // Load default source on mount
  useEffect(() => { load("dramacool"); }, [load]);

  const dramaSlug = (data?.dramaId ?? "").replace("drama-detail/", "");

  return (
    <div className="space-y-0">

      {/* ── Source selector ─────────────────────────────────────────────── */}
      <div className="bg-[#0a0c12] border-b border-white/5 px-3 py-2 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        <span className="text-[10px] text-muted-foreground/60 font-medium mr-2 shrink-0 uppercase tracking-wider">Source:</span>
        {SOURCES.map((src) => (
          <button
            key={src.id}
            onClick={() => load(src.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all border ${
              activeSource === src.id
                ? "bg-brand-600 border-brand-500 text-white shadow-glow-sm"
                : "border-white/10 text-muted-foreground hover:border-brand-700/50 hover:text-white bg-transparent"
            }`}
          >
            <span>{src.flag}</span>
            <span>{src.label}</span>
            {activeSource === src.id && loading && (
              <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── Player ──────────────────────────────────────────────────────── */}
      <div className="bg-black w-full" style={{ aspectRatio: "16/9" }}>
        {loading ? (
          <Loading source={activeSource} />
        ) : error && !data?.embedUrl ? (
          <div className="size-full flex items-center justify-center">
            <div className="text-center space-y-3 px-8">
              <Flame className="w-8 h-8 text-red-800 mx-auto" strokeWidth={1.5} />
              <p className="text-xs text-white font-semibold tracking-wider">SOURCE UNAVAILABLE</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <p className="text-xs text-brand-400">Try a different source above</p>
            </div>
          </div>
        ) : data?.embedUrl || (data?.allEmbeds?.length ?? 0) > 0 ? (
          <IframePlayer
            allEmbeds={data!.allEmbeds.length > 0 ? data!.allEmbeds : [data!.embedUrl!]}
            title={`Episode ${data?.number ?? ""}`}
          />
        ) : data?.hlsUrl ? (
          <HlsPlayer url={data.hlsUrl} />
        ) : (
          <div className="size-full flex items-center justify-center">
            <div className="text-center space-y-3 px-8">
              <Flame className="w-8 h-8 text-brand-700 mx-auto" strokeWidth={1.5} />
              <p className="text-sm text-white font-semibold tracking-wider">NO STREAM FOUND</p>
              <p className="text-xs text-muted-foreground">Try a different source above.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <div className="bg-[#0f1117] border-t border-white/5 px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {data?.title && <p className="text-xs text-brand-400 truncate">{data.title}</p>}
          {data?.number && <p className="text-sm font-semibold text-white">Episode {data.number}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={data?.prev ? `/watch/${data.prev}` : "#"}
            aria-disabled={!data?.prev}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border transition-colors ${
              data?.prev ? "border-white/20 text-white hover:bg-white/10" : "border-white/5 text-white/20 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </Link>
          {dramaSlug && (
            <Link href={`/drama/${dramaSlug}`}
              className="inline-flex items-center px-2.5 py-1.5 text-xs rounded border border-brand-700/40 text-brand-400 hover:bg-brand-950/40 transition-colors">
              All Episodes
            </Link>
          )}
          <Link
            href={data?.next ? `/watch/${data.next}` : "#"}
            aria-disabled={!data?.next}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border transition-colors ${
              data?.next ? "border-white/20 text-white hover:bg-white/10" : "border-white/5 text-white/20 pointer-events-none"
            }`}
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
