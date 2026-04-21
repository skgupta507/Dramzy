"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Flame, ChevronLeft, ChevronRight, RefreshCw } from "@/components/icons";
import Link from "next/link";

interface StreamData {
  embedUrl: string | null;
  hlsUrl: string | null;
  title: string;
  number: number;
  dramaId: string;
  next: string | null;
  prev: string | null;
}

// ── Iframe player ─────────────────────────────────────────────────────────────
function IframePlayer({ src, title }: { src: string; title: string }) {
  const [key, setKey] = useState(0);
  const retry = useCallback(() => setKey((k) => k + 1), []);
  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        key={key}
        src={src}
        title={title}
        className="w-full h-full border-0 block"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

// ── Native HLS player ─────────────────────────────────────────────────────────
function HlsPlayer({ url, seekTo }: { url: string; seekTo?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      if (seekTo) video.currentTime = seekTo;
      setReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.7/hls.min.js";
    s.onload = () => {
      const Hls = (window as any).Hls;
      if (Hls?.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (seekTo) video.currentTime = seekTo;
          setReady(true);
        });
      }
    };
    document.head.appendChild(s);
  }, [url, seekTo]);

  return (
    <div className="size-full bg-black relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame className="w-8 h-8 text-sky-600 mx-auto animate-pulse" strokeWidth={1.5} />
        </div>
      )}
      <video ref={videoRef} className="w-full h-full" controls playsInline
        style={{ display: ready ? "block" : "none" }} />
    </div>
  );
}

// ── Main WatchPlayer ──────────────────────────────────────────────────────────
export function WatchPlayer({ episodeId }: { episodeId: string }) {
  const [data, setData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/stream?id=${encodeURIComponent(episodeId)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [episodeId]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
        <div className="size-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <Flame className="w-8 h-8 text-sky-600 mx-auto animate-pulse" strokeWidth={1.5} />
            <p className="text-xs text-slate-400 tracking-widest">LOADING STREAM…</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="w-full bg-black" style={{ aspectRatio: "16/9" }}>
        <div className="size-full flex items-center justify-center">
          <div className="text-center space-y-3 px-8">
            <Flame className="w-8 h-8 text-red-800 mx-auto" strokeWidth={1.5} />
            <p className="text-xs text-white font-semibold tracking-wider">STREAM ERROR</p>
            <button
              onClick={() => { setLoading(true); setError(false); fetch(`/api/stream?id=${encodeURIComponent(episodeId)}`).then(r=>r.json()).then(d=>{setData(d);setLoading(false);}).catch(()=>{setError(true);setLoading(false);}); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-white/20 rounded text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dramaSlug = data.dramaId.replace("drama-detail/", "");

  return (
    <div className="space-y-0">
      {/* Player */}
      <div className="bg-black w-full" style={{ aspectRatio: "16/9" }}>
        {data.embedUrl
          ? <IframePlayer src={data.embedUrl} title={`Episode ${data.number}`} />
          : data.hlsUrl
            ? <HlsPlayer url={data.hlsUrl} />
            : (
              <div className="size-full flex items-center justify-center">
                <div className="text-center space-y-2 px-8">
                  <Flame className="w-8 h-8 text-slate-700 mx-auto" strokeWidth={1.5} />
                  <p className="text-xs text-white font-semibold tracking-wider">NO STREAM AVAILABLE</p>
                  <p className="text-xs text-slate-400">No source found. Try again later.</p>
                </div>
              </div>
            )}
      </div>

      {/* Title + nav bar */}
      <div className="bg-[#0f1117] border-t border-white/5 px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-sky-400 truncate">{data.title}</p>
          <p className="text-sm font-semibold text-white">Episode {data.number}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={data.prev ? `/watch/${data.prev}` : "#"}
            aria-disabled={!data.prev}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border transition-colors ${data.prev ? "border-white/20 text-white hover:bg-white/10" : "border-white/5 text-white/20 pointer-events-none"}`}>
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </Link>
          <Link href={`/drama/${dramaSlug}`}
            className="inline-flex items-center px-2.5 py-1.5 text-xs rounded border border-sky-700/40 text-sky-400 hover:bg-sky-950/40 transition-colors">
            All Episodes
          </Link>
          <Link href={data.next ? `/watch/${data.next}` : "#"}
            aria-disabled={!data.next}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border transition-colors ${data.next ? "border-white/20 text-white hover:bg-white/10" : "border-white/5 text-white/20 pointer-events-none"}`}>
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
