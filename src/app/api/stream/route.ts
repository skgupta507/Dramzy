import { getEpisodeSources, getEpisodeInfo } from "@/lib/dramacool";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const episodeId = req.nextUrl.searchParams.get("id");
  if (!episodeId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const [sources, info] = await Promise.all([
    getEpisodeSources(episodeId),
    getEpisodeInfo(episodeId),
  ]);

  return NextResponse.json({
    embedUrl: sources?.embedUrl ?? null,
    hlsUrl: sources?.sources.find((s) => s.isM3U8)?.url ?? sources?.sources[0]?.url ?? null,
    title: info.title,
    number: info.number,
    dramaId: info.dramaId,
    next: info.episodes.next ?? null,
    prev: info.episodes.previous ?? null,
  });
}
