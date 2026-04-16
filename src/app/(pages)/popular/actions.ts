"use server";

import { getTrending } from "@/lib/dramacool";

export async function loadMore(page: number) {
  const data = await getTrending(page);
  return data?.results ?? [];
}
