/**
 * /api/player-proxy?url=ENCODED_URL
 *
 * Fetches the embed player HTML, strips ad/tracker scripts,
 * patches internal resource URLs to absolute, and returns clean HTML.
 * This keeps ad scripts server-side so they never execute in the browser.
 */
import { NextRequest, NextResponse } from "next/server";

const AD_PATTERNS = [
  /googlesyndication\.com/i,
  /doubleclick\.net/i,
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /adsbygoogle/i,
  /popads\./i,
  /popcash\./i,
  /exoclick\./i,
  /trafficjunky/i,
  /adnxs\.com/i,
  /adskeeper/i,
  /adsterra/i,
  /hilltopads/i,
  /propellerads/i,
  /push\.network/i,
  /monetag/i,
  /paupsoborofoow/i,
  /gh\.quaukruffed/i,
  /gn\.fancierregula/i,
  /cdn-fileserver\.com/i,
  /tag\.min\.js/i,
];

function stripAds(html: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const origin = base.origin;

  // Remove <script> tags whose src matches ad patterns
  html = html.replace(/<script[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/script>/gi, (match, src) => {
    if (AD_PATTERNS.some((p) => p.test(src))) return "";
    return match;
  });

  // Remove inline <script> blocks that contain ad domains
  html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, code) => {
    if (AD_PATTERNS.some((p) => p.test(code))) return "";
    return match;
  });

  // Remove ad <iframe>s and <img> beacons from known ad networks
  html = html.replace(/<(iframe|img)[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, (match, tag, src) => {
    if (AD_PATTERNS.some((p) => p.test(src))) return "";
    return match;
  });

  // Patch relative URLs to absolute so resources load correctly
  html = html.replace(/(src|href|action)=["'](\/)([^"']*?)["']/gi, (_, attr, slash, path) => {
    return `${attr}="${origin}/${path}"`;
  });

  // Do NOT inject a CSP — it would block the player's own legitimate script loading
  // (e.g. JW Player loads chunks from ssl.p.jwpcdn.com which a CSP would block).
  // Ad removal is handled by the regex passes above instead.

  return html;
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return new NextResponse("Missing url", { status: 400 });

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(rawUrl);
    new URL(targetUrl); // validate
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://dramacool.sh/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const contentType = upstream.headers.get("content-type") ?? "text/html";

    // Only proxy HTML — pass binary/media through directly
    if (!contentType.includes("text/html")) {
      const body = await upstream.arrayBuffer();
      return new NextResponse(body, {
        status: upstream.status,
        headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
      });
    }

    let html = await upstream.text();
    html = stripAds(html, targetUrl);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        // Fully open CSP so the player can load its own scripts (JW Player, HLS.js etc.)
        "Content-Security-Policy": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
        // Allow embedding in our iframe
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[player-proxy]", err);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
