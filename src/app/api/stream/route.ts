/**
 * /api/stream?id=EPISODE_ID&source=SOURCE&title=OPTIONAL_TITLE
 */
import { getEpisodeSources, getEpisodeInfo } from "@/lib/dramacool";
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const UA     = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const UA_MOB = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchPage(url: string, referer: string, mobile = false): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":      mobile ? UA_MOB : UA,
        "Referer":         referer,
        "Accept":          "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest":  "document",
        "Sec-Fetch-Mode":  "navigate",
        "Sec-Fetch-Site":  "none",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, referer: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Referer": referer, "Accept": "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.trim().startsWith("<") || text.includes("Just a moment") || text.includes("challenge-platform")) {
      throw new Error(`CF challenge / HTML response from ${new URL(url).hostname}`);
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

// ── Deobfuscate eval packer ───────────────────────────────────────────────────

function deobfuscate(p: string, a: number, c: number, k: string[]): string {
  while (c--) { if (k[c]) p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]); }
  return p;
}

// ── Extract embed/server URLs from episode HTML ───────────────────────────────

function extractEmbeds(html: string): string[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (u?: string | null) => {
    if (!u) return;
    const t = u.trim();
    if (t.startsWith("http") && !seen.has(t)) { seen.add(t); out.push(t); }
  };

  // data-server attributes (DramaCool / KissAsian theme)
  $("[data-server]").each((_, el) => add($(el).attr("data-server")));

  let m: RegExpExecArray | null;
  const re1 = /data-server=["'](https?:\/\/[^"']+)["']/g;
  while ((m = re1.exec(html))) add(m[1]);

  // iframes
  $("iframe[src]").each((_, el) => add($(el).attr("src")));

  // script embed URLs
  const scripts = $("script").map((_, el) => $(el).html() ?? "").get().join("\n");
  const re2 = /(https?:\/\/(?:streamwish|dwish|filelions|dlions|vidbasic|vidmoly|doodstream|streamtape|upstream|rabbitstream|megacloud|chillx|wishembed|embedload|embed)[^"'\s<>]+)/gi;
  while ((m = re2.exec(scripts))) add(m[1]);

  // value= attributes with stream/embed URLs
  const re3 = /value=["'](https?:\/\/[^"']+(?:stream|embed|watch)[^"']+)["']/gi;
  while ((m = re3.exec(html))) add(m[1]);

  return out;
}

// ── Extract m3u8 from HTML/JS ─────────────────────────────────────────────────

function extractM3u8(html: string): string | null {
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
      const d = deobfuscate(pm[1], +pm[2], +pm[3], pm[4].split("|"));
      const u = (d.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/g) ?? [])[0];
      if (u) return u;
    }
  }

  const jw = scripts.match(/["']?file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)['"]/);
  if (jw) return jw[1];

  const atbs = scripts.match(/atob\(["']([A-Za-z0-9+/=]{20,})["']\)/g) ?? [];
  for (const enc of atbs) {
    try {
      const b64 = enc.match(/atob\(["']([^"']+)["']\)/)?.[1];
      if (!b64) continue;
      const decoded = Buffer.from(b64, "base64").toString();
      const u = decoded.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/)?.[1];
      if (u) return u;
    } catch { /* skip */ }
  }

  return scripts.match(/(https?:\/\/[^"'\s<>]+\.m3u8(?:[^"'\s<>]*)?)/)?.[1] ?? null;
}

// ── Try a list of candidate URLs ──────────────────────────────────────────────

async function tryUrls(urls: string[], referer: string): Promise<{ html: string; url: string } | null> {
  for (const url of urls) {
    for (const mobile of [false, true]) {
      try {
        const html = await fetchPage(url, referer, mobile);
        if (html.includes("Just a moment") || html.includes("challenge-platform") || html.includes("cf-browser-verification")) continue;
        if (html.length < 500) continue;
        return { html, url };
      } catch { /* try next */ }
    }
  }
  return null;
}

// ── Candidate episode URLs for a given base site ──────────────────────────────

function episodeUrls(base: string, id: string): string[] {
  const clean = id.replace(/\/$/, "");
  const noYear = clean.replace(/-\d{4}(-episode)/, "$1");
  return [
    `${base}/${clean}/`,
    `${base}/${noYear}/`,
    `${base}/watch/${clean}/`,
    `${base}/episode/${clean}/`,
    `${base}/${clean}-english-sub/`,
    `${base}/${clean}-english-subbed/`,
  ];
}

// ── Get deployed API base URL ─────────────────────────────────────────────────

function getApiBase(): string {
  return (process.env.XYRA_API_URL ?? "")
    .replace(/\/v1\/dramacool\/?$/, "")
    .replace(/\/dramacool\/?$/, "")
    .replace(/\/v1\/?$/, "")
    .replace(/\/$/, "");
}

// ── MyAsianTV ─────────────────────────────────────────────────────────────────

async function scrapeMAT(episodeId: string) {
  const base   = "https://myasiantv.com.lv";
  const apiBase = getApiBase();
  const apiKey  = process.env.XYRA_API_KEY ?? "key1";

  // PRIMARY: deployed Dramzy API (handles MAT's AJAX-rendered embeds)
  if (apiBase) {
    try {
      const url = `${apiBase}/v1/myasiantv/stream?api_key=${encodeURIComponent(apiKey)}&episode_id=${encodeURIComponent(episodeId)}`;
      const data = await fetchJson(url, base + "/");
      if (data?.success && (data?.embed_iframe_url || data?.has_m3u8)) {
        const allEmbeds: string[] = [];
        if (data.embed_iframe_url) allEmbeds.push(data.embed_iframe_url);
        for (const srv of Object.values(data.data ?? {})) {
          const s = srv as any;
          if (s.embeded_link && !allEmbeds.includes(s.embeded_link)) allEmbeds.push(s.embeded_link);
        }
        const hlsUrl = (Object.values(data.data ?? {}) as any[]).find(s => s.m3u8 && s.stream)?.stream ?? null;
        return { embedUrl: allEmbeds[0] ?? null, allEmbeds, hlsUrl, finalUrl: url };
      }
    } catch { /* fall through */ }
  }

  // FALLBACK: inline static scrape + WordPress AJAX
  const result = await tryUrls(episodeUrls(base, episodeId), base + "/");
  if (!result) throw new Error("MyAsianTV: episode page not found");

  let embeds = extractEmbeds(result.html);

  // Try WordPress admin-ajax.php if no static embeds found
  if (embeds.length === 0) {
    const postIdMatch = result.html.match(/(?:post_id|postid|data-post)[^0-9]*(\d+)/i)
      ?? result.html.match(/<article[^>]+id="post-(\d+)"/i)
      ?? result.html.match(/"post_id":(\d+)/);
    const postId = postIdMatch?.[1];
    if (postId) {
      for (const action of ["ajax_movie", "player_ajax", "get_player", "load_player"]) {
        try {
          const ajaxRes = await fetch(`${base}/wp-admin/admin-ajax.php`, {
            method: "POST",
            headers: {
              "User-Agent": UA, "Referer": result.url,
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: new URLSearchParams({ action, post_id: postId, server: "standard" }).toString(),
            signal: AbortSignal.timeout(8000),
          });
          if (ajaxRes.ok) {
            const text = await ajaxRes.text();
            try {
              const j = JSON.parse(text);
              const u = j?.embed ?? j?.url ?? j?.src ?? j?.data?.src;
              if (typeof u === "string" && u.startsWith("http")) { embeds = [u]; break; }
            } catch {
              const ae = extractEmbeds(text);
              if (ae.length > 0) { embeds = ae; break; }
            }
          }
        } catch { /* try next */ }
      }
    }
  }

  let hlsUrl = extractM3u8(result.html);
  if (!hlsUrl && embeds[0]) {
    try { const eh = await fetchPage(embeds[0], base + "/"); hlsUrl = extractM3u8(eh); } catch { /* */ }
  }
  return { embedUrl: embeds[0] ?? null, allEmbeds: embeds, hlsUrl, finalUrl: result.url };
}

// ── KissAsian ─────────────────────────────────────────────────────────────────

async function scrapeKissAsian(episodeId: string) {
  const base   = "https://kissassian.com.co";
  const apiBase = getApiBase();
  const apiKey  = process.env.XYRA_API_KEY ?? "key1";

  // PRIMARY: deployed API
  if (apiBase) {
    try {
      const url = `${apiBase}/v1/kissasian/stream?api_key=${encodeURIComponent(apiKey)}&episode_id=${encodeURIComponent(episodeId)}`;
      const data = await fetchJson(url, base + "/");
      if (data?.success && (data?.embed_iframe_url || data?.has_m3u8)) {
        const allEmbeds: string[] = [];
        if (data.embed_iframe_url) allEmbeds.push(data.embed_iframe_url);
        for (const srv of Object.values(data.data ?? {})) {
          const s = srv as any;
          if (s.embeded_link && !allEmbeds.includes(s.embeded_link)) allEmbeds.push(s.embeded_link);
        }
        const hlsUrl = (Object.values(data.data ?? {}) as any[]).find(s => s.m3u8 && s.stream)?.stream ?? null;
        return { embedUrl: allEmbeds[0] ?? null, allEmbeds, hlsUrl, finalUrl: url };
      }
    } catch { /* fallback */ }
  }

  // FALLBACK: inline scraping
  const result = await tryUrls(episodeUrls(base, episodeId), base + "/");
  if (!result) throw new Error("KissAsian: episode page not found");
  const embeds = extractEmbeds(result.html);
  let hlsUrl = extractM3u8(result.html);
  if (!hlsUrl && embeds[0]) {
    try { const eh = await fetchPage(embeds[0], base + "/"); hlsUrl = extractM3u8(eh); } catch { /* */ }
  }
  return { embedUrl: embeds[0] ?? null, allEmbeds: embeds, hlsUrl, finalUrl: result.url };
}

// ── ViewAsian ─────────────────────────────────────────────────────────────────
// ViewAsian slug format: "rebirth-chinese-drama-2026" (adds genre keywords)
// Episode URL format:    "/rebirth-chinese-drama-2026-ep-35-eng-sub/"
// Strategy: search → drama page → pick episode link by number

async function scrapeViewAsian(episodeId: string) {
  const base = "https://viewasian.lol";
  const id   = episodeId.replace(/\/$/, "");
  const epMatch = id.match(/^(.+)-episode-(\d+)$/i);
  const dramaName = epMatch
    ? epMatch[1].replace(/-/g, " ").replace(/\d{4}$/, "").trim()
    : id.replace(/-/g, " ").trim();
  const epNum = epMatch ? parseInt(epMatch[2]) : null;

  // Step 1: Search ViewAsian
  let dramaPageUrl: string | null = null;
  try {
    const searchUrl = `${base}/?s=${encodeURIComponent(dramaName)}`;
    const searchHtml = await fetchPage(searchUrl, base + "/");
    const $ = cheerio.load(searchHtml);
    $("a[href*='/drama/']").each((_, el) => {
      if (!dramaPageUrl) {
        const href = $(el).attr("href") ?? "";
        dramaPageUrl = href.startsWith("http") ? href : `${base}${href}`;
      }
    });
  } catch { /* search failed */ }

  // Step 2: drama page → episode link
  if (dramaPageUrl && epNum) {
    try {
      const dramaHtml = await fetchPage(dramaPageUrl, base + "/");
      const $ = cheerio.load(dramaHtml);
      let episodeUrl: string | null = null;

      // Match "-ep-35-" or "-ep-35/" pattern in href
      $(`a[href*='-ep-${epNum}-'], a[href*='-ep-${epNum}/']`).each((_, el) => {
        if (!episodeUrl) {
          const href = $(el).attr("href") ?? "";
          episodeUrl = href.startsWith("http") ? href : `${base}${href}`;
        }
      });

      // Text-based fallback
      if (!episodeUrl) {
        $("a").each((_, el) => {
          const text = $(el).text().trim();
          const href = $(el).attr("href") ?? "";
          if (href && (text.includes(`Ep ${epNum}`) || text.includes(`Episode ${epNum}`))) {
            episodeUrl = href.startsWith("http") ? href : `${base}${href}`;
            return false;
          }
        });
      }

      if (episodeUrl) {
        const epResult = await tryUrls([episodeUrl], base + "/");
        if (epResult) {
          const embeds = extractEmbeds(epResult.html);
          let hlsUrl = extractM3u8(epResult.html);
          if (!hlsUrl && embeds[0]) {
            try { const eh = await fetchPage(embeds[0], base + "/"); hlsUrl = extractM3u8(eh); } catch { /* */ }
          }
          return { embedUrl: embeds[0] ?? null, allEmbeds: embeds, hlsUrl, finalUrl: episodeUrl };
        }
      }
    } catch { /* fall through */ }
  }

  throw new Error(`ViewAsian: could not find episode. Drama: "${dramaName}" Ep: ${epNum}`);
}

// ── Generic DC-clone (DramaNice, DramaGo, DramaSee) ──────────────────────────

async function scrapeGeneric(base: string, episodeId: string) {
  const result = await tryUrls(episodeUrls(base, episodeId), base + "/");
  if (!result) throw new Error(`${base}: episode page not found`);
  const embeds = extractEmbeds(result.html);
  let hlsUrl = extractM3u8(result.html);
  if (!hlsUrl && embeds[0]) {
    try { const eh = await fetchPage(embeds[0], base + "/"); hlsUrl = extractM3u8(eh); } catch { /* */ }
  }
  return { embedUrl: embeds[0] ?? null, allEmbeds: embeds, hlsUrl, finalUrl: result.url };
}

// ── KissKH — JSON API with numeric IDs ───────────────────────────────────────

async function scrapeKissKH(episodeId: string, dramaTitle?: string) {
  const bases = [
    process.env.KISSKH_URL,
    "https://kisskh.nl",
    "https://kisskh.asia",
  ].filter(Boolean) as string[];

  const query = dramaTitle
    ?? episodeId.replace(/-episode-\d+.*$/i, "").replace(/-/g, " ").trim();

  let lastErr = "";
  for (const base of bases) {
    try {
      const searchData = await fetchJson(
        `${base}/api/DramaList/Search?q=${encodeURIComponent(query)}&type=0`,
        base + "/"
      );
      const results: any[] = Array.isArray(searchData) ? searchData : (searchData?.data ?? []);
      if (!results.length) { lastErr = `No results for "${query}" on ${base}`; continue; }

      const dramaId = String(results[0].id);
      const infoData = await fetchJson(
        `${base}/api/DramaList/Drama/${dramaId}/Episode/0.png?err=false&broken=false`,
        base + "/"
      );
      const drama = infoData?.data ?? infoData;
      const episodes: any[] = drama?.episodesList ?? drama?.episodes ?? [];

      const epMatch = episodeId.match(/episode-(\d+)/i);
      const epNum   = epMatch ? parseInt(epMatch[1]) : null;
      const epRecord = epNum
        ? (episodes.find((e: any) => e.number === epNum || e.ep === epNum) ?? episodes[episodes.length - 1])
        : episodes[episodes.length - 1];

      if (!epRecord) { lastErr = `Episode ${epNum} not found`; continue; }

      const numericEpId = String(epRecord.id ?? epRecord.episodeId);
      const streamData  = await fetchJson(
        `${base}/api/DramaList/Episode/${numericEpId}.png?err=false&broken=false`,
        base + "/"
      );
      const sd = streamData?.data ?? streamData;
      const stream = sd?.Video ?? sd?.video ?? null;
      const backup = sd?.BackupVideo ?? sd?.backupVideo ?? null;
      const allEmbeds = [stream, backup].filter(Boolean) as string[];

      return {
        embedUrl:  allEmbeds[0] ?? null,
        allEmbeds,
        hlsUrl:    allEmbeds[0]?.includes(".m3u8") ? allEmbeds[0] : null,
        finalUrl:  `${base}/api/DramaList/Episode/${numericEpId}.png`,
      };
    } catch (e: any) { lastErr = e.message; }
  }
  throw new Error(`KissKH unreachable: ${lastErr}`);
}

// ── Response helpers ──────────────────────────────────────────────────────────

function ok(source: string, payload: object) {
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
  const title     = req.nextUrl.searchParams.get("title")?.trim();

  if (!episodeId) return fail("unknown", "Missing id param");

  // DramaCool — local lib
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
        next:      info.episodes?.next     ?? null,
        prev:      info.episodes?.previous ?? null,
      });
    } catch (err: any) { return fail("dramacool", err.message); }
  }

  // KissKH — search-based JSON API
  if (source === "kisskh") {
    try {
      const r = await scrapeKissKH(episodeId, title);
      return ok("kisskh", { ...r, title: null, number: null, next: null, prev: null });
    } catch (err: any) { return fail("kisskh", err.message); }
  }

  // All other HTML-scraped sources
  try {
    let r: any;
    switch (source) {
      case "myasiantv": r = await scrapeMAT(episodeId); break;
      case "kissasian": r = await scrapeKissAsian(episodeId); break;
      case "viewasian": r = await scrapeViewAsian(episodeId); break;
      case "dramanice": r = await scrapeGeneric("https://dramanice.click", episodeId); break;
      case "dramago":   r = await scrapeGeneric("https://dramago.rest",    episodeId); break;
      case "dramasee":  r = await scrapeGeneric("https://dramassee.com",   episodeId); break;
      default: return fail(source, `Unknown source: ${source}`);
    }
    return ok(source, { ...r, title: null, number: null, next: null, prev: null });
  } catch (err: any) {
    return fail(source, err.message);
  }
}
