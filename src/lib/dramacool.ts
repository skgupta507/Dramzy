/**
 * DRAMZY — Xyra Stream API Client
 * Base: https://api.xyra.stream/v1/dramacool
 *
 * Field names sourced from the actual API source code (api.xyra-main).
 */

import type {
  EpisodeInfo, Featured, Recent, Search, TopAiring, XyraDramaInfo, XyraStreamResult,
} from "@/types";
import { toSlug, toDramaId } from "@/lib/slug";

const BASE_URL =
  process.env.XYRA_API_URL?.replace(/\/$/, "") ??
  "https://api.xyra.stream/v1/dramacool";
const API_KEY = process.env.XYRA_API_KEY ?? "";

// Secondary source: MyAsianTV (same Dramzy API deployment, different namespace)
const MAT_BASE_URL = process.env.XYRA_API_URL
  ? process.env.XYRA_API_URL.replace(/\/dramacool\/?$/, "/myasiantv")
  : null;

// ─── Core GET fetcher ─────────────────────────────────────────────────────────

async function xyraGet<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  fetchOptions: RequestInit = {},
): Promise<T | null> {
  const qs = new URLSearchParams({ api_key: API_KEY });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const url = `${BASE_URL}/${endpoint}?${qs}`;
  try {
    const res = await fetch(url, { method: "GET", ...fetchOptions });
    if (!res.ok) {
      console.error(`[Xyra] GET /${endpoint} → HTTP ${res.status} (${JSON.stringify(params)})`);
      return null;
    }
    const json = await res.json();
    // The API wraps all responses in { success: true, data: {...} }
    return (json?.data ?? json) as T;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(code ?? "")) {
      console.error(`[Xyra] Cannot reach ${BASE_URL} (${code})`);
    } else {
      console.error(`[Xyra] GET /${endpoint}:`, err);
    }
    return null;
  }
}

// ─── Exact API response types (from source code) ─────────────────────────────

/** Card as returned by /home, /popular, /latest, /search */
type XyraCardRaw = {
  // /popular, /search use these
  id?: string;
  title?: string;
  image?: string;
  url?: string;
  status?: string;
  type?: string;
  // /home uses original_id for episode links, id for drama links
  original_id?: string;
};

type XyraPagedRaw = {
  currentPage?: number; hasNextPage?: boolean;
  results?: XyraCardRaw[]; data?: XyraCardRaw[];
  drama?: XyraCardRaw[]; [key: string]: unknown;
};

/**
 * Exact fields from /info endpoint (info.js source):
 *   title, thumbnail, synopsis, other_name, total_episode,
 *   duration, rating, airs, country, status, release_year,
 *   genres, starring, trailer, episodes[]
 */
type XyraInfoRaw = {
  title?: string;
  thumbnail?: string;          // ← correct field (not "image" or "cover")
  synopsis?: string;           // ← correct field (not "description")
  other_name?: string;         // ← singular string (not array)
  total_episode?: string;
  duration?: string;
  rating?: string;
  airs?: string;
  country?: string;
  status?: string;
  release_year?: string;
  genres?: string[];
  starring?: string[];
  trailer?: string;
  episodes?: XyraEpisodeRaw[];
};

/**
 * Exact episode fields from /info endpoint (info.js source):
 *   { title, episode_id, time }
 * episode_id is the slug used directly by /stream
 * e.g. "my-girlfriend-is-an-alien-2-2022-episode-1-english-subbed"
 */
type XyraEpisodeRaw = {
  episode_id?: string;         // ← THE correct field name from API source!
  title?: string;
  time?: string;
  // Legacy fallbacks (in case API version differs)
  id?: string;
  episodeId?: string;
  url?: string;
};

/**
 * /stream response (stream.js source):
 * Returns { success, data: { serverName: { embeded_link, m3u8, stream, sub } }, has_m3u8 }
 * OR on fallback: { success, data: { iframe_only: { embeded_link } } }
 */
/** Raw stream fetch — returns the FULL JSON without unwrapping json.data
 *  because /stream has top-level fields (has_m3u8, embed_iframe_url) we need */
async function xyraGetStream(episodeId: string): Promise<XyraStreamFullResponse | null> {
  const qs = new URLSearchParams({ api_key: API_KEY, episode_id: episodeId });
  const url = `${BASE_URL}/stream?${qs}`;
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) {
      console.error(`[Xyra] GET /stream → HTTP ${res.status} (episode_id: ${episodeId})`);
      return null;
    }
    return (await res.json()) as XyraStreamFullResponse;
  } catch (err: unknown) {
    console.error(`[Xyra] GET /stream:`, err);
    return null;
  }
}

/** Shape of a single server entry in the stream response */
type XyraServerData = {
  embeded_link?: string;
  stream?: string;
  sub?: string;
  m3u8?: boolean;
  embed_only?: boolean;
  skipped?: boolean;
  error?: string;
};

/** Full /stream response — do NOT unwrap, we need top-level fields */
type XyraStreamFullResponse = {
  success?: boolean;
  has_m3u8?: boolean;
  episode_url?: string;
  embed_iframe_url?: string;
  server_url?: string;
  data?: Record<string, XyraServerData>;
  // Legacy flat response format (older API versions)
  sources?: Array<{ url?: string; isM3U8?: boolean; quality?: string; file?: string }>;
  embedUrl?: string; embed_url?: string; iframe?: string;
};

/** Alias used for episode metadata (kept for getEpisodeInfo compat) */
type XyraStreamRaw = XyraStreamFullResponse & {
  title?: string;
  number?: number | string;
  dramaId?: string; drama_id?: string;
  downloadLink?: string; download_link?: string;
  nextEpisodeId?: string; prevEpisodeId?: string;
  episodes?: { next?: string; previous?: string; prev?: string; list?: Array<{ value?: string; label?: string }> };
};

// ─── Normalisers ──────────────────────────────────────────────────────────────

function isValidImage(src?: string): boolean {
  return !!(src?.trim() && (src.startsWith("http") || src.startsWith("/")));
}

function cardId(c: XyraCardRaw): string {
  // For episode cards from /home, use original_id (full episode slug)
  // For drama cards, use id (drama slug)
  return toSlug(c.original_id || c.id || c.url || "");
}

function normaliseCard(c: XyraCardRaw): Featured {
  return {
    id: toSlug(c.id || c.url || ""),          // drama id (for /drama/[slug])
    title: c.title ?? "Unknown",
    image: isValidImage(c.image) ? c.image! : "/placeholder.svg",
    status: c.status,
    type: c.type,
  };
}

/** For episode cards from /home (recent section) — keep original_id as the episode link */
function normaliseEpisodeCard(c: XyraCardRaw): Featured {
  return {
    id: toSlug(c.original_id || c.id || c.url || ""),  // full episode slug for /watch
    title: c.title ?? "Unknown",
    image: isValidImage(c.image) ? c.image! : "/placeholder.svg",
    status: c.status,
    type: c.type,
  };
}

function extractCards(raw: unknown, forEpisodes = false): XyraCardRaw[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as XyraCardRaw[];
  if (typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  for (const key of ["results", "data", "drama", "dramas", "items", "list"]) {
    if (Array.isArray(obj[key])) return obj[key] as XyraCardRaw[];
  }
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      return val as XyraCardRaw[];
    }
  }
  return [];
}

function extractPaged(raw: XyraPagedRaw) {
  return {
    currentPage: raw.currentPage ?? 1,
    hasNextPage: raw.hasNextPage ?? false,
    results: extractCards(raw),
  };
}

function normaliseStatus(s?: string): "ongoing" | "completed" | "upcoming" | undefined {
  if (!s) return undefined;
  const l = s.toLowerCase();
  if (l.includes("ongoing") || l.includes("airing")) return "ongoing";
  if (l.includes("complet")) return "completed";
  if (l.includes("upcoming") || l.includes("announce")) return "upcoming";
  return undefined;
}

function normaliseEpisode(e: XyraEpisodeRaw, index: number) {
  // episode_id is the exact field from /info (api source: info.js)
  // It's the slug used directly by /stream — DO NOT modify it
  const epId = e.episode_id ?? e.id ?? e.episodeId ?? "";

  // Extract episode number from the episode_id slug or title
  const numFromId = epId.match(/episode[-_](\d+)/i)?.[1];
  const numFromTitle = e.title?.match(/(?:episode|ep)[\s\-_]?(\d+)/i)?.[1];
  const epNum = Number(numFromId ?? numFromTitle ?? index + 1);

  return {
    id: epId,                         // exact slug for /stream
    title: e.title ?? `Episode ${epNum}`,
    episode: epNum,
    subType: "SUB" as const,
    releaseDate: e.time ?? "",
  };
}

const emptyPaged = (page = 1): TopAiring => ({ currentPage: page, hasNextPage: false, results: [] });

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getFeatured(): Promise<Featured[]> {
  const raw = await xyraGet<unknown>("home", {}, { next: { revalidate: 600 } } as RequestInit);
  if (!raw) return [];
  return extractCards(raw).map(normaliseCard).filter((c) => c.id && isValidImage(c.image));
}

/** getRecent uses original_id for episode links (correct for /watch) */
export async function getRecent(page = 1): Promise<Recent> {
  let raw = await xyraGet<XyraPagedRaw>("latest_kdrama", { page }, { cache: "no-store" } as RequestInit);
  if (!raw) raw = await xyraGet<XyraPagedRaw>("latest", { page }, { cache: "no-store" } as RequestInit);
  if (!raw) return emptyPaged(page);
  const items = extractCards(raw);
  // Use normaliseEpisodeCard to preserve original_id as episode link
  const results = items
    .map((c) => ({
      id: toSlug(c.original_id || c.id || c.url || ""),
      title: c.title ?? "Unknown",
      image: isValidImage(c.image) ? c.image! : "/placeholder.svg",
      status: c.status,
      type: c.type,
    }))
    .filter((c) => c.id && isValidImage(c.image));
  return { currentPage: 1, hasNextPage: false, results };
}

export async function getTrending(page = 1): Promise<TopAiring> {
  const raw = await xyraGet<XyraPagedRaw>("popular", { page }, { next: { revalidate: 300 } } as RequestInit);
  if (!raw) return emptyPaged(page);
  const p = extractPaged(raw);
  return { currentPage: p.currentPage, hasNextPage: p.hasNextPage, results: p.results.map(normaliseCard).filter((c) => c.id && isValidImage(c.image)) };
}

export async function getOngoing(page = 1): Promise<TopAiring> {
  const raw = await xyraGet<XyraPagedRaw>("ongoing", { page }, { next: { revalidate: 300 } } as RequestInit);
  if (!raw) return emptyPaged(page);
  const p = extractPaged(raw);
  return { currentPage: p.currentPage, hasNextPage: p.hasNextPage, results: p.results.map(normaliseCard) };
}

export async function getUpcoming(page = 1): Promise<TopAiring> {
  const raw = await xyraGet<XyraPagedRaw>("upcoming", { page }, { next: { revalidate: 3600 } } as RequestInit);
  if (!raw) return emptyPaged(page);
  const p = extractPaged(raw);
  return { currentPage: p.currentPage, hasNextPage: p.hasNextPage, results: p.results.map(normaliseCard) };
}

export async function search(query: string, page = 1): Promise<Search> {
  const raw = await xyraGet<XyraPagedRaw>("search", { query, page }, { cache: "no-store" } as RequestInit);
  if (!raw) return emptyPaged(page);
  const p = extractPaged(raw);
  return { currentPage: p.currentPage, hasNextPage: p.hasNextPage, results: p.results.map(normaliseCard) };
}

export async function discover(
  page = 1,
  filters: { type?: string; country?: string; genre?: string; release_year?: string | number } = {},
): Promise<TopAiring> {
  const raw = await xyraGet<XyraPagedRaw>("discover", { page, ...filters }, { next: { revalidate: 600 } } as RequestInit);
  if (!raw) return emptyPaged(page);
  const p = extractPaged(raw);
  return { currentPage: p.currentPage, hasNextPage: p.hasNextPage, results: p.results.map(normaliseCard) };
}

function mapRawToInfo(cleanSlug: string, raw: XyraInfoRaw): XyraDramaInfo {
  return {
    id: cleanSlug,
    title: raw.title ?? "Unknown",
    image: isValidImage(raw.thumbnail) ? raw.thumbnail! : "/placeholder.svg",
    description: raw.synopsis ?? "",
    otherNames: raw.other_name ? [raw.other_name] : undefined,
    genres: raw.genres,
    releaseDate: raw.release_year ? Number(raw.release_year) : undefined,
    status: raw.status === "Ongoing"
      ? "ongoing"
      : raw.status === "Completed"
      ? "completed"
      : raw.status === "Upcoming"
      ? "upcoming"
      : undefined,
    country:  raw.country  ?? undefined,
    duration: raw.duration ?? undefined,
    rating:   raw.rating   ?? undefined,
    starring: raw.starring ?? [],
    trailer:  raw.trailer  ?? undefined,
    episodes: Array.isArray(raw.episodes)
      ? [...raw.episodes].reverse().map((e, i) => normaliseEpisode(e, i))
      : [],
  };
}

export async function getDramaInfo(slug: string): Promise<XyraDramaInfo | null> {
  const cleanSlug = toSlug(decodeURIComponent(slug));
  const id = cleanSlug.replace(/^drama-detail\//, "").replace(/^drama-detail%2F/i, "");

  // PRIMARY: deployed Xyra API
  const raw = await xyraGet<XyraInfoRaw>("info", { id }, { next: { revalidate: 3600 } } as RequestInit);

  if (raw) {
    return mapRawToInfo(cleanSlug, raw);
  }

  // FALLBACK: scrape DramaCool directly from Next.js server
  // (episode pages are reliably accessible even when drama pages are CF-blocked)
  try {
    const dramaUrl = `https://dramacool.sh/${id}/`;
    const ep1Url   = `https://dramacool.sh/${id}-episode-1/`;

    let html = "";
    let fetchedUrl = dramaUrl;
    for (const url of [dramaUrl, ep1Url]) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Referer":         "https://dramacool.sh/",
            "Accept":          "text/html,application/xhtml+xml,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest":  "document",
            "Sec-Fetch-Mode":  "navigate",
            "Sec-Fetch-Site":  "none",
          },
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const text = await res.text();
          if (!text.includes("Just a moment") && !text.includes("challenge-platform") && text.length > 1000) {
            html = text;
            fetchedUrl = url;
            break;
          }
        }
      } catch { /* try next URL */ }
    }

    if (!html) return null;

    // Parse HTML with regex (no cheerio in Next.js lib — avoid the dependency)
    const title       = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ?? id;
    const imgMatch    = html.match(/wp-content\/uploads[^"']+\.(jpg|png|webp)/i);
    const thumbnail   = imgMatch ? "https://dramacool.sh/" + imgMatch[0].replace(/^https?:\/\/[^/]+\//, "") : null;
    const synopsis    = html.match(/Synopsis[:\s]+([^<]{30,500})/i)?.[1]?.trim() ?? null;
    const country     = html.match(/href="[^"]*\/country\/[^"]*">([^<]+)<\/a>/i)?.[1]?.trim() ?? null;
    const status      = html.match(/href="[^"]*\/drama-status\/[^"]*">([^<]+)<\/a>/i)?.[1]?.trim() ?? null;
    const releaseYear = html.match(/href="[^"]*\/release-year\/[^"]*">([^<]+)<\/a>/i)?.[1]?.trim() ?? null;
    const genres      = [...html.matchAll(/href="[^"]*\/genre\/[^"]*">([^<]+)<\/a>/gi)].map(m => m[1].trim()).filter(Boolean);
    const starring    = [...html.matchAll(/href="[^"]*\/(?:actor|star)\/[^"]*">([^<]+)<\/a>/gi)].map(m => m[1].trim()).filter(Boolean);
    const trailer     = html.match(/iframe[^>]*src="([^"]*youtu[^"]+)"/i)?.[1] ?? null;

    // Episode slugs from hrefs
    const epMatches   = [...html.matchAll(/href="\/([^"]+episode-\d+[^"]*)"/gi)];
    const seen        = new Set<string>();
    const episodes    = epMatches
      .map(m => m[1].replace(/\/$/, ""))
      .filter(s => s.includes("episode") && !seen.has(s) && seen.add(s))
      .map((epSlug, i) => normaliseEpisode({ id: epSlug, title: epSlug, number: i + 1, time: "" }, i))
      .reverse();

    return {
      id: cleanSlug,
      title: title ?? id,
      image: thumbnail ? (thumbnail.startsWith("http") ? thumbnail : `https://dramacool.sh/${thumbnail}`) : "/placeholder.svg",
      description: synopsis ?? "",
      otherNames: undefined,
      genres,
      releaseDate: releaseYear ? Number(releaseYear) : undefined,
      status:   status ?? undefined,
      country:  country ?? undefined,
      duration: undefined,
      rating:   undefined,
      starring,
      trailer:  trailer ?? undefined,
      episodes,
    };
  } catch {
    return null;
  }
}

/**
 * Get streaming sources for an episode.
 * episode_id MUST be the exact slug from /info episodes[].episode_id
 * The API visits: https://dramacool.sh/{episode_id}/ and scrapes it.
 *
 * Returns sources array OR embedUrl from the server data.
 */
// Best embed provider priority (most reliable first for iframe fallback)
const EMBED_PRIORITY = ["streamwish", "dwish", "filelions", "dlions", "vidbasic", "standard", "iframe_only"];

export async function getEpisodeSources(episodeId: string): Promise<XyraStreamResult | null> {
  const cleanId = episodeId.startsWith("http") ? toSlug(episodeId) : episodeId;

  // Use dedicated stream fetcher — preserves full response (has_m3u8, embed_iframe_url etc.)
  const full = await xyraGetStream(cleanId);
  if (!full) return null;

  const sources: XyraStreamResult["sources"] = [];
  const subtitles: XyraStreamResult["subtitles"] = [];
  let embedUrl: string | undefined;

  // ── Parse server data (API returns { data: { serverName: {...} } }) ─────────
  const serverMap = full.data;

  if (serverMap && typeof serverMap === "object") {
    const entries = Object.entries(serverMap);

    // Collect direct HLS streams
    for (const [, srv] of entries) {
      if (srv.skipped) continue;
      if (srv.stream && srv.m3u8) {
        sources.push({ url: srv.stream, isM3U8: true });
      }
      if (srv.sub) subtitles.push({ url: srv.sub, lang: "English" });
    }

    // Pick the best embed link by provider priority
    for (const priority of EMBED_PRIORITY) {
      const match = entries.find(([name]) => name.toLowerCase().includes(priority));
      if (match && !match[1].skipped && match[1].embeded_link) {
        embedUrl = match[1].embeded_link;
        break;
      }
    }
    // Fallback: first non-skipped server with an embed link
    if (!embedUrl) {
      const fallback = entries.find(([, d]) => !d.skipped && d.embeded_link);
      if (fallback) embedUrl = fallback[1].embeded_link;
    }
  }

  // ── Legacy flat format (older API versions) ───────────────────────────────
  if (sources.length === 0 && full.sources) {
    for (const s of full.sources) {
      const url = s.url ?? "";
      if (url) sources.push({ url, isM3U8: s.isM3U8 ?? url.includes(".m3u8") });
    }
  }

  // ── Top-level embed fallback from full response ────────────────────────────
  if (!embedUrl) {
    embedUrl = full.embed_iframe_url ?? full.embedUrl ?? full.embed_url ?? full.iframe;
  }

  console.log(`[Stream] episode=${cleanId} | sources=${sources.length} | embedUrl=${embedUrl ? "✓" : "✗"} | has_m3u8=${full.has_m3u8}`);

  // Collect ALL embed URLs in priority order for client-side fallback
  const allEmbeds: string[] = [];
  if (serverMap && typeof serverMap === "object") {
    const entries = Object.entries(serverMap);
    // Priority order first
    for (const priority of EMBED_PRIORITY) {
      const match = entries.find(([name]) => name.toLowerCase().includes(priority));
      if (match && !match[1].skipped && match[1].embeded_link && !allEmbeds.includes(match[1].embeded_link)) {
        allEmbeds.push(match[1].embeded_link);
      }
    }
    // Then any remaining
    for (const [, d] of entries) {
      if (!d.skipped && d.embeded_link && !allEmbeds.includes(d.embeded_link)) {
        allEmbeds.push(d.embeded_link);
      }
    }
  }
  if (embedUrl && !allEmbeds.includes(embedUrl)) allEmbeds.unshift(embedUrl);

  return { sources, subtitles, embedUrl, allEmbeds };
}


export async function getEpisodeInfo(episodeSlug: string): Promise<EpisodeInfo> {
  // episodeSlug from the URL e.g. "my-girlfriend-is-an-alien-2-2022-episode-1"
  // Parse episode number from slug
  const epMatch =
    episodeSlug.match(/episode[-_](\d+)/i) ??
    episodeSlug.match(/ep[-_](\d+)/i);
  const epNumber = Number(epMatch?.[1] ?? 1);

  // Strip episode suffix to recover drama slug
  const dramaSlug = episodeSlug
    .replace(/-episode-\d+.*/i, "")
    .replace(/-ep-\d+.*/i, "");
  const dramaId = toDramaId(dramaSlug);

  // getDramaInfo is cached — fast on second call (same page visit)
  let title = dramaSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  let nextId: string | undefined;
  let prevId: string | undefined;

  try {
    const info = await getDramaInfo(dramaSlug);
    if (info?.title) title = info.title;

    if (info?.episodes && info.episodes.length > 0) {
      // Find this episode by matching episode number
      const idx = info.episodes.findIndex(
        (e) => e.episode === epNumber || e.id === episodeSlug
      );
      if (idx !== -1) {
        nextId = info.episodes[idx + 1]?.id;
        prevId = idx > 0 ? info.episodes[idx - 1]?.id : undefined;
      }
    }
  } catch {
    // Silently continue — we have enough from the slug
  }

  return {
    id: episodeSlug,
    title,
    dramaId,
    number: epNumber,
    downloadLink: "",
    episodes: { next: nextId, previous: prevId, list: [] },
  };
}
