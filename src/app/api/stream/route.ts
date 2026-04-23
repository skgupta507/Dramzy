import { getEpisodeSources, getEpisodeInfo } from "@/lib/dramacool";
import { NextRequest, NextResponse } from "next/server";

// Secondary sources — same Dramzy API deployment, different namespace paths
function getApiBase() {
  const url = process.env.XYRA_API_URL ?? "https://api.xyra.stream/v1/dramacool";
  return url.replace(/\/dramacool\/?$/, "").replace(/\/v1\/?$/, "");
}

async function fetchFromSource(source: string, episodeId: string): Promise<any> {
  const apiBase = getApiBase();
  const apiKey  = process.env.XYRA_API_KEY ?? "key1";
  const url = `${apiBase}/v1/${source}/stream?api_key=${apiKey}&episode_id=${encodeURIComponent(episodeId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const episodeId = req.nextUrl.searchParams.get("id");
  const source    = req.nextUrl.searchParams.get("source") ?? "dramacool"; // default

  if (!episodeId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // For DramaCool: use the existing lib function (most optimised)
  if (source === "dramacool") {
    const [sources, info] = await Promise.all([
      getEpisodeSources(episodeId),
      getEpisodeInfo(episodeId),
    ]);
    return NextResponse.json({
      source: "dramacool",
      embedUrl:  sources?.embedUrl ?? null,
      allEmbeds: sources?.allEmbeds ?? [],
      hlsUrl:    sources?.sources.find((s) => s.isM3U8)?.url ?? sources?.sources[0]?.url ?? null,
      title:     info.title,
      number:    info.number,
      dramaId:   info.dramaId,
      next:      info.episodes.next ?? null,
      prev:      info.episodes.previous ?? null,
    });
  }

  // For other sources: proxy to the respective API namespace
  try {
    const data = await fetchFromSource(source, episodeId);
    return NextResponse.json({
      source,
      embedUrl:  data.embed_iframe_url ?? null,
      allEmbeds: data.embed_iframe_url ? [data.embed_iframe_url] : [],
      hlsUrl:    Object.values(data.data ?? {}).find((s: any) => s.m3u8 && s.stream)?.stream ?? null,
      has_m3u8:  data.has_m3u8 ?? false,
      // Episode nav not available from secondary sources — keep null
      title:  null,
      number: null,
      next:   null,
      prev:   null,
    });
  } catch (err: any) {
    return NextResponse.json({ source, error: err.message, embedUrl: null, allEmbeds: [] }, { status: 502 });
  }
}
