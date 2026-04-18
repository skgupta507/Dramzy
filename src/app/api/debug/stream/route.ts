import { type NextRequest, NextResponse } from "next/server";

/** Debug: visit /api/debug/stream?id=episode-slug to verify stream parsing */
export async function GET(req: NextRequest) {
  const episodeId = req.nextUrl.searchParams.get("id") ?? "veil-of-shadows-2026-episode-1";
  const apiKey = process.env.XYRA_API_KEY ?? "key1";
  const baseUrl = process.env.XYRA_API_URL ?? "https://api.xyra.stream/v1/dramacool";

  const url = `${baseUrl}/stream?api_key=${apiKey}&episode_id=${encodeURIComponent(episodeId)}`;
  const res = await fetch(url, { cache: "no-store" });
  const raw = await res.json();

  const serverMap = raw?.data ?? {};
  const sources: string[] = [];
  const embeds: Record<string, string> = {};

  for (const [name, srv] of Object.entries(serverMap as Record<string, any>)) {
    if (srv.stream && srv.m3u8) sources.push(srv.stream);
    if (!srv.skipped && srv.embeded_link) embeds[name] = srv.embeded_link;
  }

  return NextResponse.json({
    http_status: res.status,
    api_success: raw?.success,
    has_m3u8: raw?.has_m3u8,
    episode_url: raw?.episode_url,
    embed_iframe_url: raw?.embed_iframe_url,
    server_names: Object.keys(serverMap),
    extracted_hls_sources: sources,
    extracted_embeds: embeds,
    best_embed: Object.values(embeds)[0] ?? null,
  });
}
