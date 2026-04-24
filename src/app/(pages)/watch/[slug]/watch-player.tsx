"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Flame, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle,
} from "@/components/icons";
import Link from "next/link";

const SOURCES = [
  { id: "dramacool",  label: "DramaCool",  flag: "🎬", referer: "https://dramacool.sh/" },
  { id: "myasiantv",  label: "MyAsianTV",  flag: "📺", referer: "https://myasiantv.com.lv/" },
  { id: "kisskh",     label: "KissKH",     flag: "🎭", referer: "https://kisskh.asia/" },
  { id: "kissasian",  label: "KissAsian",  flag: "💋", referer: "https://kissassian.com.co/" },
  { id: "viewasian",  label: "ViewAsian",  flag: "👁️", referer: "https://viewasian.lol/" },
] as const;

type SourceId = typeof SOURCES[number]["id"];

interface StreamData {
  source:    string;
  embedUrl:  string | null;
  allEmbeds: string[];
  hlsUrl:    string | null;
  title:     string | null;
  number:    number | null;
  dramaId?:  string | null;
  next:      string | null;
  prev:      string | null;
  error?:    string;
}

// Builds the proxied URL, passing the source referer so embedload.cfd returns valid data
function proxyEmbed(url: string, referer: string): string {
  return `/api/player-proxy?url=${encodeURIComponent(url)}&ref=${encodeURIComponent(referer)}`;
}

// ── Pure iframe — zero overlays ───────────────────────────────────────────────
function IframePlayer({
  src, title, iframeKey,
}: {
  src: string; title: string; iframeKey: number;
}) {
  return (
    <iframe
      key={iframeKey}
      src={src}
      title={title}
      className="w-full h-full border-0 block bg-black"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
      referrerPolicy="no-referrer"
    />
  );
}

// ── Native HLS fallback ───────────────────────────────────────────────────────
function HlsPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      setReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.7/hls.min.js";
    s.onload = () => {
      const Hls = (window as any).Hls;
      if (!Hls?.isSupported()) return;
      const hls = new Hls({
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.setRequestHeader("Referer", "https://dramacool.sh/");
        },
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setReady(true));
    };
    document.head.appendChild(s);
  }, [url]);

  return (
    <div className="w-full h-full bg-black relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Flame className="w-8 h-8 text-brand-600 animate-pulse" strokeWidth={1.5} />
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        style={{ display: ready ? "block" : "none" }}
      />
    </div>
  );
}

// ── Placeholder states ────────────────────────────────────────────────────────
function PlayerLoading({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <Flame className="w-8 h-8 text-brand-600 animate-pulse mx-auto" strokeWidth={1.5} />
        <p className="text-[11px] text-white/30 tracking-widest uppercase">Loading {label}…</p>
      </div>
    </div>
  );
}

function PlayerError({ message }: { message: string }) {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-center space-y-2 px-8 max-w-sm">
        <Flame className="w-8 h-8 text-red-800 mx-auto" strokeWidth={1.5} />
        <p className="text-[11px] text-white font-semibold tracking-wider uppercase">Source unavailable</p>
        <p className="text-[10px] text-white/30 leading-relaxed">{message}</p>
        <p className="text-[10px] text-brand-400">↑ Try another source above</p>
      </div>
    </div>
  );
}

function PlayerNoStream() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-center space-y-2 px-8">
        <Flame className="w-8 h-8 text-brand-700 mx-auto" strokeWidth={1.5} />
        <p className="text-[11px] text-white font-semibold tracking-wider uppercase">No stream found</p>
        <p className="text-[10px] text-white/30">Try a different source above.</p>
      </div>
    </div>
  );
}

// ── Toolbar button (shared style) ─────────────────────────────────────────────
function ToolbarBtn({
  onClick, active, activeClass, children, title,
}: {
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors ${
        active
          ? activeClass ?? "border-brand-600/60 bg-brand-950/50 text-brand-300"
          : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function WatchPlayer({ episodeId }: { episodeId: string }) {
  const [activeSource, setActiveSource] = useState<SourceId>("dramacool");
  const [data,    setData]    = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [embedIdx, setEmbedIdx] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [adBlock, setAdBlock] = useState(true);

  const activeSourceObj = SOURCES.find(s => s.id === activeSource) ?? SOURCES[0];

  const load = useCallback((src: SourceId) => {
    setLoading(true);
    setError(null);
    setData(null);
    setActiveSource(src);
    setEmbedIdx(0);
    setIframeKey(k => k + 1);
    fetch(`/api/stream?id=${encodeURIComponent(episodeId)}&source=${src}`)
      .then(r => r.json())
      .then((d: StreamData) => {
        setData(d);
        setLoading(false);
        if (d.error && !d.embedUrl && !(d.allEmbeds?.length)) setError(d.error);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [episodeId]);

  useEffect(() => { load("dramacool"); }, [load]);

  const allEmbeds = data?.allEmbeds?.length
    ? data.allEmbeds
    : data?.embedUrl ? [data.embedUrl] : [];

  const currentEmbed = allEmbeds[embedIdx] ?? null;
  const dramaSlug    = (data?.dramaId ?? "").replace("drama-detail/", "");

  // The iframe src — proxied (with correct referer) or direct
  const iframeSrc = currentEmbed
    ? adBlock
      ? proxyEmbed(currentEmbed, activeSourceObj.referer)
      : currentEmbed
    : null;

  const hasPrev = embedIdx > 0;
  const hasNext = embedIdx < allEmbeds.length - 1;

  return (
    <div className="w-full">

      {/* ── Row 1: Source selector ─────────────────────────────────────── */}
      <div className="bg-[#090c14] border-b border-white/5 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[9px] text-white/25 font-bold uppercase tracking-[0.15em] shrink-0">Source</span>
        {SOURCES.map(src => (
          <button
            key={src.id}
            onClick={() => load(src.id)}
            disabled={loading && activeSource === src.id}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium border transition-all ${
              activeSource === src.id
                ? "bg-brand-600 border-brand-500 text-white shadow-sm"
                : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/80"
            }`}
          >
            <span>{src.flag}</span>
            <span>{src.label}</span>
            {activeSource === src.id && loading && (
              <span className="w-1 h-1 rounded-full bg-white/70 animate-ping" />
            )}
          </button>
        ))}
      </div>

      {/* ── Row 2: Player (pure video area — no controls inside) ───────── */}
      <div className="bg-black w-full" style={{ aspectRatio: "16/9" }}>
        {loading ? (
          <PlayerLoading label={activeSourceObj.label} />
        ) : error ? (
          <PlayerError message={error} />
        ) : iframeSrc ? (
          <IframePlayer src={iframeSrc} title={`Episode ${data?.number ?? ""}`} iframeKey={iframeKey} />
        ) : data?.hlsUrl ? (
          <HlsPlayer url={data.hlsUrl} />
        ) : (
          <PlayerNoStream />
        )}
      </div>

      {/* ── Row 3: Player controls toolbar (100% outside the player) ───── */}
      <div className="bg-[#090c14] border-t border-white/5 px-3 py-2 flex items-center gap-2 flex-wrap">

        {/* Server switcher — only shown when multiple embeds available */}
        {allEmbeds.length > 1 && (
          <div className="flex items-center border border-white/10 rounded overflow-hidden">
            <button
              disabled={!hasPrev}
              onClick={() => { setEmbedIdx(i => i - 1); setIframeKey(k => k + 1); }}
              className="px-2 py-1.5 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-colors"
              title="Previous server"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-white/30 font-mono px-2">
              Server {embedIdx + 1}/{allEmbeds.length}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => { setEmbedIdx(i => i + 1); setIframeKey(k => k + 1); }}
              className="px-2 py-1.5 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-colors"
              title="Next server"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Ad-filter toggle */}
        <ToolbarBtn
          onClick={() => { setAdBlock(b => !b); setIframeKey(k => k + 1); }}
          active={adBlock}
          activeClass="border-brand-600/60 bg-brand-950/50 text-brand-300 hover:bg-brand-900/40"
          title={adBlock ? "Ad filter ON — click to disable" : "Ad filter OFF — click to enable"}
        >
          <AlertTriangle className="w-3 h-3" />
          {adBlock ? "Ads Filtered" : "Ads Off"}
        </ToolbarBtn>

        {/* Reload */}
        <ToolbarBtn onClick={() => setIframeKey(k => k + 1)} title="Reload player">
          <RefreshCw className="w-3 h-3" /> Reload
        </ToolbarBtn>

        {/* Spacer pushes nav to the right */}
        <div className="flex-1 min-w-0" />

        {/* Episode title (hidden on mobile) */}
        {data?.title && (
          <span className="text-[10px] text-white/25 hidden sm:block truncate max-w-[180px]">
            {data.title}{data.number ? ` · Ep ${data.number}` : ""}
          </span>
        )}

        {/* Episode navigation */}
        <div className="flex items-center gap-1.5">
          <Link
            href={data?.prev ? `/watch/${data.prev}` : "#"}
            aria-disabled={!data?.prev}
            className={`inline-flex items-center gap-0.5 px-2.5 py-1.5 text-[11px] rounded border transition-colors ${
              data?.prev
                ? "border-white/15 text-white/60 hover:bg-white/5 hover:text-white"
                : "border-white/5 text-white/15 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-3 h-3" /> Prev
          </Link>

          {dramaSlug && (
            <Link
              href={`/drama/${dramaSlug}`}
              className="inline-flex items-center px-2.5 py-1.5 text-[11px] rounded border border-brand-700/40 text-brand-400 hover:bg-brand-950/40 transition-colors"
            >
              Episodes
            </Link>
          )}

          <Link
            href={data?.next ? `/watch/${data.next}` : "#"}
            aria-disabled={!data?.next}
            className={`inline-flex items-center gap-0.5 px-2.5 py-1.5 text-[11px] rounded border transition-colors ${
              data?.next
                ? "border-white/15 text-white/60 hover:bg-white/5 hover:text-white"
                : "border-white/5 text-white/15 pointer-events-none"
            }`}
          >
            Next <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
