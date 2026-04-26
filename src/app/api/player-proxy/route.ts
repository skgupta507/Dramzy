/**
 * /api/player-proxy?url=ENCODED_URL&ref=ENCODED_REFERER
 *
 * - Fetches embed player HTML with correct Referer spoofing
 * - Strips ad scripts  
 * - Rewrites all m3u8/ts URLs inside the HTML to go through this proxy
 *   (fixes HLS 403 — CDN checks Referer; without this the browser hits the CDN directly)
 */
import { NextRequest, NextResponse } from "next/server";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const AD_PATTERNS = [
  /googlesyndication\.com/i, /doubleclick\.net/i, /google-analytics\.com/i,
  /googletagmanager\.com/i,  /adsbygoogle/i,      /popads\./i,
  /popcash\./i,              /exoclick\.com/i,     /trafficjunky/i,
  /adnxs\.com/i,             /adskeeper/i,         /adsterra/i,
  /hilltopads/i,             /propellerads/i,      /monetag/i,
  /push\.network/i,          /paupsoborofoow/i,    /gh\.quaukruffed/i,
  /cdn-fileserver\.com/i,    /veroexchange\.com/i, /streamsss\.net/i,
  /gn\.fancierregula/i,      /l\.cdn-fileserver/i,
  /larinpayment\.com/i,      /bvtpk\.com/i,          /videocdnshop\.com/i,
  /adblockDetector/i,        /InteractiveAdvertising/i,
];

function stripAds(html: string): string {
  // Remove <script src="...ad-domain...">
  html = html.replace(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>[\s\S]*?<\/script>/gi,
    (m, src) => AD_PATTERNS.some(p => p.test(src)) ? "" : m);
  // Remove inline scripts containing ad domains
  html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi,
    (m, code) => AD_PATTERNS.some(p => p.test(code)) ? "" : m);
  // Remove ad iframes
  html = html.replace(/<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
    (m, src) => AD_PATTERNS.some(p => p.test(src)) ? "" : m);
  return html;
}

/**
 * Rewrite m3u8 URLs inside HTML/JS so the browser fetches them via this proxy.
 * This is necessary because JW Player loads HLS segments directly from the CDN
 * with the browser's Referer, causing 403 on Referer-protected CDNs.
 */
function rewriteM3u8Urls(html: string, proxyBase: string, ref: string): string {
  const refEnc = encodeURIComponent(ref);

  // Replace m3u8 URLs in string literals (both single and double quoted)
  html = html.replace(/(["'])(https?:\/\/[^"']+\.m3u8[^"']*)\1/gi, (_, q, url) => {
    const proxied = `${proxyBase}/api/player-proxy?url=${encodeURIComponent(url)}&ref=${refEnc}`;
    return `${q}${proxied}${q}`;
  });

  // Replace m3u8 URLs in JW Player file: assignments without quotes
  html = html.replace(/(file\s*:\s*)(https?:\/\/[^,\s\]})]+\.m3u8[^,\s\]})]*)/gi, (_, key, url) => {
    const proxied = `${proxyBase}/api/player-proxy?url=${encodeURIComponent(url)}&ref=${refEnc}`;
    return `${key}${proxied}`;
  });

  return html;
}

const SOURCE_REFERERS: Record<string, string> = {
  "dramacool.sh":      "https://dramacool.sh/",
  "myasiantv.com.lv":  "https://myasiantv.com.lv/",
  "kissassian.com.co": "https://kissassian.com.co/",
  "viewasian.lol":     "https://viewasian.lol/",
  "dramanice.click":   "https://dramanice.click/",
  "dramago.rest":      "https://dramago.rest/",
  "dramassee.com":     "https://dramassee.com/",
  "asiaflix.net":      "https://asiaflix.net/",
  "kisskh.asia":       "https://kisskh.asia/",
};

function pickReferer(targetUrl: string, hint: string | null): string {
  if (hint) { try { return decodeURIComponent(hint); } catch { /* fallthrough */ } }
  try {
    const u = new URL(targetUrl);
    for (const [domain, ref] of Object.entries(SOURCE_REFERERS)) {
      if (u.hostname.includes(domain)) return ref;
    }
    return u.origin + "/";
  } catch {
    return "https://dramacool.sh/";
  }
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  const hint   = req.nextUrl.searchParams.get("ref");

  if (!rawUrl) return new NextResponse("Missing url", { status: 400 });

  let targetUrl: string;
  try { targetUrl = decodeURIComponent(rawUrl); new URL(targetUrl); }
  catch { return new NextResponse("Invalid url", { status: 400 }); }

  const referer = pickReferer(targetUrl, hint);
  const origin  = referer.replace(/\/$/, "");

  // Determine our proxy base URL for rewriting m3u8 links
  const reqUrl    = new URL(req.url);
  const proxyBase = `${reqUrl.protocol}//${reqUrl.host}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":      UA,
        "Referer":         referer,
        "Origin":          origin,
        "Accept":          "*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";

    // ── m3u8 playlist — rewrite segment URLs to go through our proxy ──────
    if (contentType.includes("application/vnd.apple.mpegurl")
      || contentType.includes("application/x-mpegurl")
      || targetUrl.includes(".m3u8")) {
      let text = await res.text();
      // Rewrite absolute segment/chunk URLs
      text = text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
        return `${proxyBase}/api/player-proxy?url=${encodeURIComponent(url)}&ref=${encodeURIComponent(referer)}`;
      });
      return new NextResponse(text, {
        status: res.status,
        headers: {
          "Content-Type":                "application/vnd.apple.mpegurl",
          "Cache-Control":               "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // ── Binary media (ts segments, mp4) — pass through with spoofed headers ─
    if (!contentType.includes("text/html") && !contentType.includes("javascript")) {
      const body = await res.arrayBuffer();
      return new NextResponse(body, {
        status: res.status,
        headers: {
          "Content-Type":                contentType,
          "Cache-Control":               "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // ── HTML/JS — strip ads, rewrite m3u8 URLs ────────────────────────────
    let html = await res.text();
    html = stripAds(html);
    html = rewriteM3u8Urls(html, proxyBase, referer);

    return new NextResponse(html, {
      headers: {
        "Content-Type":                "text/html; charset=utf-8",
        "Cache-Control":               "no-store",
        "Content-Security-Policy":     "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
        "X-Frame-Options":             "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[player-proxy]", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
