import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { watchList } from "@/db/schema/main";
import { absoluteUrl } from "@/lib/utils";
import { desc, eq, notInArray } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const metaSchema = z.object({
  email_address: z.string().email(),
});

export const dynamic = "force-dynamic";

/**
 * Protected by a static Bearer token.
 * Set API_SECRET_KEY in your env to enable this route.
 * GET /api/user/activity?email=user@example.com
 */
export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  const apiKey = process.env.API_SECRET_KEY;
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const email = req.nextUrl.searchParams.get("email");
  const parse = metaSchema.safeParse({ email_address: email });
  if (!parse.success) {
    return NextResponse.json(
      { message: "Missing or invalid email query param." },
      { status: 400 },
    );
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, parse.data.email_address),
      with: {
        watchlists: {
          orderBy: [desc(watchList.updatedAt), desc(watchList.createdAt)],
          where: notInArray(watchList.status, [
            "dropped",
            "on_hold",
            "plan_to_watch",
          ]),
          columns: {
            episode: true,
            status: true,
            updatedAt: true,
            createdAt: true,
          },
          with: {
            series: {
              columns: { title: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      user.watchlists.map((w) => ({
        title: w.series.title,
        date: w.updatedAt ?? w.createdAt,
        episode: w.episode,
        status: w.status,
        url: absoluteUrl(`/drama/${w.series.slug.replace("drama-detail/", "")}`),
      })),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 },
    );
  }
}
