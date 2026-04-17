import { type NextRequest, NextResponse } from "next/server";

/**
 * Debug: Visit /api/debug/episode?slug=drama-slug
 * Shows the raw /info response so you can verify episode_id format
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "my-girlfriend-is-an-alien-2-2022";
  const apiKey = process.env.XYRA_API_KEY ?? "key1";
  const baseUrl = process.env.XYRA_API_URL ?? "https://api.xyra.stream/v1/dramacool";

  const id = `drama-detail/${slug}`;
  const infoUrl = `${baseUrl}/info?api_key=${apiKey}&id=${encodeURIComponent(id)}`;
  const infoRes = await fetch(infoUrl, { cache: "no-store" });
  const infoJson = await infoRes.json();
  const data = infoJson?.data ?? infoJson;

  const episodes = data?.episodes ?? [];
  const firstEp = episodes[0];

  // Also test the stream endpoint with the first episode's episode_id
  let streamResult = null;
  if (firstEp?.episode_id) {
    const streamUrl = `${baseUrl}/stream?api_key=${apiKey}&episode_id=${encodeURIComponent(firstEp.episode_id)}`;
    const streamRes = await fetch(streamUrl, { cache: "no-store" });
    streamResult = await streamRes.json();
  }

  return NextResponse.json({
    info_status: infoRes.status,
    drama_title: data?.title,
    top_level_keys: Object.keys(data ?? {}),
    episode_count: episodes.length,
    first_episode: firstEp ?? null,
    first_episode_keys: firstEp ? Object.keys(firstEp) : [],
    stream_test_id: firstEp?.episode_id ?? null,
    stream_status: streamResult?.success ?? null,
    stream_has_m3u8: streamResult?.has_m3u8 ?? null,
    stream_servers: streamResult?.data ? Object.keys(streamResult.data) : null,
  }, { status: 200 });
}
