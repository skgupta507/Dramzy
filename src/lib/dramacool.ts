/**
 * DRAMZY — Xyra Stream API Client
 * Base: https://api.xyra.stream/v1/dramacool
 */

import type {
  EpisodeInfo, Featured, Recent, Search, TopAiring, XyraDramaInfo, XyraStreamResult,
} from "@/types";
import { toSlug, toDramaId } from "@/lib/slug";

const BASE_URL =
  process.env.XYRA_API_URL?.replace(/\/$/, "") ??
  "https://api.xyra.stream/v1/dramacool";
const API_KEY = process.env.XYRA_API_KEY ?? "";

// ─── Core fetcher ─────────────────────────────────────────────────────────────

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
      console.error(`[Xyra] GET /${endpoint} → HTTP ${res.status} (id: ${params.episode_id ?? params.id ?? ""})`);
      return null;
    }
    const json = await res.json();
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

/**
 * Try multiple episode_id candidates and return the first successful response.
 * The Xyra /stream endpoint is picky about the id format.
 * Common formats:
 *   "drama-slug-episode-3-english-subbed"
 *   "drama-slug-episode-3"
 *   "drama-slug-episode-3-english-sub"
 *   "drama-slug-ep-3"
 */
async function tryStreamVariants<T>(baseId: string): Promise<T | null> {
  const variants = [
    baseId,
    `${baseId}-english-subbed`,
    `${baseId}-english-sub`,
    // If it already has a suffix, try without it
    baseId.replace(/-english-subbed$/, ""),
    baseId.replace(/-english-sub$/, ""),
    // Try replacing -episode- with -ep-
    baseId.replace(/-episode-/, "-ep-"),
    // Try replacing -ep- with -episode-
    baseId.replace(/-ep-(\d+)/, "-episode-$1"),
  ];

  // Deduplicate
  const seen = new Set<string>();
  const deduped = variants.filter((v) => {
    if (seen.has(v) || !v) return false;
    seen.add(v);
    return true;
  });

  for (const candidate of deduped) {
    const result = await xyraGet<T>("stream", { episode_id: candidate }, { cache: "no-store" } as RequestInit);
    if (result) {
      console.log(`[Xyra] /stream succeeded with id: "${candidate}"`);
      return result;
    }
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type XyraCardRaw = {
  id?: string; title?: string; image?: string; url?: string; status?: string; type?: string;
};
type XyraPagedRaw = {
  currentPage?: number; hasNextPage?: boolean;
  results?: XyraCardRaw[]; data?: XyraCardRaw[]; drama?: XyraCardRaw[];
  [key: string]: unknown;
};
type XyraInfoRaw = {
  id?: string; title?: string; image?: string; cover?: string; thumbnail?: string;
  description?: string; synopsis?: string;
  otherNames?: string[]; other_names?: string[];
  genres?: string[]; genre?: string[];
  releaseDate?: number | string; release_year?: number | string; year?: number | string;
  status?: string;
  episodes?: XyraEpisodeRaw[]; episodeList?: XyraEpisodeRaw[];
};
type XyraEpisodeRaw = {
  id?: string; episodeId?: string; url?: string;
  title?: string;
  episode?: number | string; episodeNumber?: number | string; num?: number | string;
  subType?: string; sub_type?: string; type?: string;
  releaseDate?: string; release_date?: string;
};
type XyraStreamRaw = {
  sources?: Array<{ url?: string; isM3U8?: boolean; quality?: string; file?: string }>;
  source?: string;
  subtitles?: Array<{ url?: string; lang?: string; label?: string; file?: string }>;
  tracks?: Array<{ url?: string; file?: string; lang?: string; label?: string; kind?: string }>;
  embedUrl?: string; embed_url?: string; iframe?: string; download?: string;
  title?: string; seriesTitle?: string;
  id?: string; dramaId?: string; drama_id?: string;
  number?: number | string; episodeNo?: number | string; episodeNumber?: number | string;
  downloadLink?: string; download_link?: string;
  nextEpisodeId?: string; prevEpisodeId?: string;
  next?: string; previous?: string; prev?: string;
  episodes?: { next?: string; previous?: string; prev?: string; list?: Array<{ value?: string; label?: string }> };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidImage(src?: string): boolean {
  return !!(src && src.trim() !== "" && (src.startsWith("http") || src.startsWith("/")));
}

function cardId(c: XyraCardRaw): string {
  return toSlug(c.id || c.url || "");
}

function normaliseCard(c: XyraCardRaw): Featured {
  return {
    id: cardId(c),
    title: c.title ?? "Unknown",
    image: isValidImage(c.image) ? c.image! : "/placeholder.svg",
    status: c.status,
    type: c.type,
  };
}

function extractCards(raw: unknown): XyraCardRaw[] {
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

function normaliseEpisode(e: XyraEpisodeRaw, index: number, dramaSlug: string) {
  const subRaw = (e.subType ?? e.sub_type ?? e.type ?? "SUB").toUpperCase();
  const subType: "SUB" | "DUB" | "RAW" =
    subRaw === "DUB" ? "DUB" : subRaw === "RAW" ? "RAW" : "SUB";
  const epNum = Number(e.episode ?? e.episodeNumber ?? e.num ?? index + 1);

  // Try explicit id fields first
  const rawId = e.id ?? e.episodeId ?? e.url ?? "";
  let epId = rawId ? toSlug(rawId) : "";

  // Fallback: construct the most common DramaCool episode slug format
  if (!epId) {
    epId = `${dramaSlug}-episode-${epNum}`;
  }

  return {
    id: epId,
    title: e.title ?? `Episode ${epNum}`,
    episode: epNum,
    subType,
    releaseDate: e.releaseDate ?? e.release_date ?? "",
  };
}

const emptyPaged = (page = 1): TopAiring => ({ currentPage: page, hasNextPage: false, results: [] });

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getFeatured(): Promise<Featured[]> {
  const raw = await xyraGet<unknown>("home", {}, { next: { revalidate: 600 } } as RequestInit);
  if (!raw) return [];
  return extractCards(raw).map(normaliseCard).filter((c) => c.id && isValidImage(c.image));
}

export async function getRecent(page = 1): Promise<Recent> {
  let raw = await xyraGet<XyraPagedRaw>("latest_kdrama", { page }, { cache: "no-store" } as RequestInit);
  if (!raw) raw = await xyraGet<XyraPagedRaw>("latest", { page }, { cache: "no-store" } as RequestInit);
  if (!raw) return emptyPaged(page);
  const p = extractPaged(raw);
  return { currentPage: p.currentPage, hasNextPage: p.hasNextPage, results: p.results.map(normaliseCard).filter((c) => c.id && isValidImage(c.image)) };
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

export async function getDramaInfo(slug: string): Promise<XyraDramaInfo | null> {
  const cleanSlug = toSlug(decodeURIComponent(slug));
  const id = toDramaId(cleanSlug);
  const raw = await xyraGet<XyraInfoRaw>("info", { id }, { next: { revalidate: 3600 } } as RequestInit);
  if (!raw) return null;
  const episodes = raw.episodes ?? raw.episodeList ?? [];
  return {
    id: cleanSlug,
    title: raw.title ?? "Unknown",
    image: isValidImage(raw.image ?? raw.cover ?? raw.thumbnail) ? (raw.image ?? raw.cover ?? raw.thumbnail)! : "/placeholder.svg",
    description: raw.description ?? raw.synopsis ?? "",
    otherNames: raw.otherNames ?? raw.other_names,
    genres: raw.genres ?? raw.genre,
    releaseDate: Number(raw.releaseDate ?? raw.release_year ?? raw.year ?? 0) || undefined,
    status: normaliseStatus(raw.status),
    episodes: Array.isArray(episodes) ? episodes.map((e, i) => normaliseEpisode(e, i, cleanSlug)) : [],
  };
}

export async function getEpisodeSources(episodeId: string): Promise<XyraStreamResult | null> {
  // episodeId is already normalised by the watch page — don't double-process
  const cleanId = episodeId.startsWith("http") ? toSlug(episodeId) : episodeId;
  const raw = await tryStreamVariants<XyraStreamRaw>(cleanId);
  if (!raw) return null;

  const sourcesRaw = raw.sources ?? (raw.source ? [{ url: raw.source }] : []);
  const sources = sourcesRaw
    .map((s) => ({ url: s.url ?? s.file ?? "", isM3U8: s.isM3U8 ?? (s.url ?? s.file ?? "").includes(".m3u8"), quality: s.quality }))
    .filter((s) => s.url);

  const subsRaw = raw.subtitles ?? raw.tracks ?? [];
  const subtitles = subsRaw
    .filter((s) => s.kind !== "thumbnails")
    .filter((s) => (s.url ?? s.file) && (s.lang ?? s.label))
    .map((s) => ({ url: s.url ?? s.file ?? "", lang: s.lang ?? s.label ?? "Unknown" }));

  return {
    sources,
    subtitles,
    embedUrl: raw.embedUrl ?? raw.embed_url ?? raw.iframe,
  };
}

export async function getEpisodeInfo(episodeSlug: string): Promise<EpisodeInfo> {
  const cleanSlug = episodeSlug.startsWith("http") ? toSlug(episodeSlug) : episodeSlug;

  const raw = await tryStreamVariants<XyraStreamRaw>(cleanSlug);

  const epMatch =
    cleanSlug.match(/episode[-_\s](\d+)/i) ??
    cleanSlug.match(/-ep[-_](\d+)/i) ??
    cleanSlug.match(/-(\d+)(?:-english|-sub|-raw|-dub|$)/i);
  const epNumber = Number(raw?.number ?? raw?.episodeNo ?? raw?.episodeNumber ?? epMatch?.[1] ?? 1);

  const rawDramaId = raw?.dramaId ?? raw?.drama_id ?? "";
  const dramaId = rawDramaId
    ? toDramaId(toSlug(rawDramaId))
    : toDramaId(
        cleanSlug
          .replace(/-episode[-_\s]\d+.*/i, "")
          .replace(/-ep[-_]\d+.*/i, "")
          .replace(/-\d+(?:-english|-sub|-raw|-dub)?$/i, ""),
      );

  // Title from API or derive from slug
  const title =
    raw?.title ??
    raw?.seriesTitle ??
    dramaId
      .replace("drama-detail/", "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const nextId = raw?.episodes?.next ?? raw?.nextEpisodeId ?? raw?.next;
  const prevId = raw?.episodes?.previous ?? raw?.episodes?.prev ?? raw?.prevEpisodeId ?? raw?.previous ?? raw?.prev;

  return {
    id: cleanSlug,
    title,
    dramaId,
    number: epNumber,
    downloadLink: raw?.downloadLink ?? raw?.download_link ?? raw?.download ?? "",
    episodes: {
      next: nextId ? toSlug(nextId) : undefined,
      previous: prevId ? toSlug(prevId) : undefined,
      list: raw?.episodes?.list ?? [],
    },
  };
}
