import { db } from "@/db";
import { series } from "@/db/schema/main";
import { getTrending } from "@/lib/dramacool";
import { sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Syncs trending dramas from Xyra Stream API into the local DB.
 * Protected by API_SECRET_KEY Bearer token.
 *
 * POST /api/series/sync
 * Authorization: Bearer <API_SECRET_KEY>
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKey = process.env.API_SECRET_KEY;

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new NextResponse("unauthorized", { status: 403 });
  }

  try {
    const trends = await getTrending();
    if (!trends?.results?.length) {
      return NextResponse.json(
        { error: "Failed to fetch trending dramas from Xyra API." },
        { status: 502 },
      );
    }

    const valuesToInsert: (typeof series.$inferInsert)[] = trends.results.map(
      (d) => ({
        coverImage: d.image,
        slug: d.id,           // Xyra returns full id like "drama-detail/slug"
        title: d.title,
      }),
    );

    await db
      .insert(series)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: [series.slug],
        set: { id: sql`${series.id}`, updatedAt: new Date() },
      });

    return NextResponse.json(
      { success: true, synced: valuesToInsert.length },
      { status: 200 },
    );
  } catch (error) {
    console.error("[sync]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
