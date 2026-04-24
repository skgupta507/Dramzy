/**
 * /api/stream?id=EPISODE_ID&source=SOURCE
 *
 * Fetches stream data for an episode from the selected source.
 * DramaCool uses the optimised local lib.
 * All other sources are scraped inline here — no external API dependency.
 */
import { getEpisodeSources, getEpisodeInfo } from "@/lib/dramacool";
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ── Shared scraping helpers ───────────────────────────────────────────────────

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchHtml(url: string, referer: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Referer": referer,
      "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

function deobfuscate(p: string, a: number, c: number, k: string[]): string {
  while (c--) {
    if (k[c]) p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
  }
  return p;
}

function extractEmbeds(html: string): string[] {
  const $ = cheerio.load(html);
  const embeds: string[] = [];

  // Method 1: data-server attributes (DramaCool/KissAsian theme)
  $("[data-server]").each((_, el) => {
    const link = $(el).attr("data-server")?.trim();
    if (link && link.startsWith("http")) embeds.push(link);
  });

  // Method 2: serverslist regex
  const re = /data-server="(https?:\/\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!embeds.includes(m[1])) embeds.push(m[1]);
  }

  // Method 3: iframes
  $("iframe[src]").each((_, el) => {
    const src = $(el).attr("src")?.trim();
    if (src && src.startsWith("http") && !embeds.includes(src)) embeds.push(src);
  });

  // Method 4: MyAsianTV .serverslist divs
  $(".serverslist").each((_, el) => {
    const link = $(el).attr("data-server")?.trim();
    if (link && !embeds.includes(link)) embeds.push(link);
  });

  return embeds;
}

function extractM3u8FromHtml(html: string): string | null {
  const $ = cheerio.load(html);
  const scripts = $("script").map((_, el) => $(el).html() ?? "").get().join("\n");

  // Eval packer
  let packed: string | null = null;
  $("script").each((_, el) => {
    const s = $(el).html() ?? "";
    if (s.includes("eval(function(p,a,c,k,e,d)")) { packed = s; return false; }
  });
  if (packed) {
    const pm = (packed as string).match(/eval\(function\(p,a,c,k,e,d\)\{.*?\}\('(.+?)',(\d+),(\d+),'(.+?)'\.split\('\|'\)\)\)/);
    if (pm) {
      const d = deobfuscate(pm[1], parseInt(pm[2]), parseInt(pm[3]), pm[4].split("|"));
      const u = (d.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g) ?? [])[0];
      if (u) return u;
    }
  }

  // JWPlayer file
  const jw = scripts.match(/["']?file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)['"]/);
  if (jw) return jw[1];

  // atob
  const atobs = scripts.match(/atob\(["']([A-Za-z0-9+/=]{20,})["']\)/g) ?? [];
  for (const enc of atobs) {
    try {
      const b64 = enc.match(/atob\(["']([^"']+)["']\)/)?.[1];
      if (!b64) continue;
      const decoded = Buffer.from(b64, "base64").toString("utf-8");
      const u = decoded.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/)?.[1];
      if (u) return u;
    } catch { /* skip */ }
  }

  // Direct scan
  return scripts.match(/(https?:\/\/[^"'\s<>]+\.m3u8(?:[^"'\s<>]*)?)/)?.[1] ?? null;
}

// ── Per-source scraper configs ────────────────────────────────────────────────

interface SourceConfig {
  base: string;
  episodeUrl: (id: string) => string[];  // candidate URLs to try
}

const SOURCE_CONFIGS: Record<string, SourceConfig> = {
  myasiantv: {
    base: "https://myasiantv.com.lv",
    episodeUrl: (id) => [
      `https://myasiantv.com.lv/${id}/`,
      `https://myasiantv.com.lv/${id}-english-sub/`,
    ],
  },
  kissasian: {
    base: "https://kissassian.com.co",
    episodeUrl: (id) => [
      `https://kissassian.com.co/${id}/`,
      `https://kissassian.com.co/${id}-english-subbed/`,
    ],
  },
  viewasian: {
    base: "https://viewasian.lol",
    episodeUrl: (id) => [
      `https://viewasian.lol/${id}/`,
      `https://viewasian.lol/watch/${id}/`,
    ],
  },
  dramanice: {
    base: "https://dramanice.click",
    episodeUrl: (id) => [`https://dramanice.click/${id}/`],
  },
  dramago: {
    base: "https://dramago.rest",
    episodeUrl: (id) => [`https://dramago.rest/${id}/`],
  },
  dramasee: {
    base: "https://dramassee.com",
    episodeUrl: (id) => [`https://dramassee.com/${id}/`],
  },
};

async function scrapeSource(source: string, episodeId: string) {
  const cfg = SOURCE_CONFIGS[source];
  if (!cfg) throw new Error(`Unknown source: ${source}`);

  // Try each candidate URL
  let html = "";
  let finalUrl = "";
  for (const url of cfg.episodeUrl(episodeId)) {
    try {
      html = await fetchHtml(url, cfg.base + "/");
      finalUrl = url;
      break;
    } catch { /* try next */ }
  }
  if (!html) throw new Error(`Episode page not found on ${source} for id: ${episodeId}`);

  const allEmbeds = extractEmbeds(html);
  const hlsUrl    = extractM3u8FromHtml(html);

  return {
    embedUrl:  allEmbeds[0] ?? null,
    allEmbeds,
    hlsUrl,
    finalUrl,
  };
}

// ── KissKH (JSON API — different from HTML scrapers) ──────────────────────────
async function scrapeKissKH(episodeId: string) {
  const base = process.env.KISSKH_URL ?? "https://kisskh.asia";
  const url  = `${base}/api/DramaList/Episode/${episodeId}.png?err=false&broken=false`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Referer": base + "/", "Accept": "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`KissKH API HTTP ${res.status}`);

  const data = await res.json();
  const stream = data?.Video || data?.video || data?.data?.Video || null;
  const backup = data?.BackupVideo || data?.backupVideo || data?.data?.BackupVideo || null;

  const allEmbeds = [stream, backup].filter(Boolean) as string[];
  return {
    embedUrl:  allEmbeds[0] ?? null,
    allEmbeds,
    hlsUrl:    stream?.includes(".m3u8") ? stream : null,
    finalUrl:  url,
  };
}

// ── Response helpers ──────────────────────────────────────────────────────────

function ok(source: string, payload: Record<string, unknown>) {
  return NextResponse.json({ source, ...payload });
}

function fail(source: string, error: string) {
  return NextResponse.json({
    source, error,
    embedUrl: null, allEmbeds: [], hlsUrl: null,
    title: null, number: null, next: null, prev: null,
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const episodeId = req.nextUrl.searchParams.get("id")?.trim();
  const source    = req.nextUrl.searchParams.get("source")?.trim() ?? "dramacool";

  if (!episodeId) return fail("unknown", "Missing id param");

  // DramaCool — local lib (most optimised, has allEmbeds + episode nav)
  if (source === "dramacool") {
    try {
      const [sources, info] = await Promise.all([
        getEpisodeSources(episodeId),
        getEpisodeInfo(episodeId),
      ]);
      return ok("dramacool", {
        embedUrl:  sources?.embedUrl ?? null,
        allEmbeds: sources?.allEmbeds ?? [],
        hlsUrl:    sources?.sources.find(s => s.isM3U8)?.url ?? null,
        title:     info.title,
        number:    info.number,
        dramaId:   info.dramaId,
        next:      info.episodes?.next      ?? null,
        prev:      info.episodes?.previous  ?? null,
      });
    } catch (err: any) {
      return fail("dramacool", err.message ?? "DramaCool scrape failed");
    }
  }

  // KissKH — JSON API
  if (source === "kisskh") {
    try {
      const result = await scrapeKissKH(episodeId);
      return ok("kisskh", { ...result, title: null, number: null, next: null, prev: null });
    } catch (err: any) {
      return fail("kisskh", err.message ?? "KissKH fetch failed");
    }
  }

  // All other HTML-scraped sources
  try {
    const result = await scrapeSource(source, episodeId);
    return ok(source, { ...result, title: null, number: null, next: null, prev: null });
  } catch (err: any) {
    return fail(source, err.message ?? `${source} scrape failed`);
  }
}
