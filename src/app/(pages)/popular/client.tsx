"use client";

import { Card } from "@/components/card";
import { Button } from "@/components/ui/button";
import type { Featured } from "@/types";
import { Loader2, ChevronDown } from "lucide-react";
import { useState, useTransition } from "react";
import { loadMore } from "./actions";

export function PopularGrid({ initial }: { initial: Featured[] }) {
  const [dramas, setDramas] = useState(initial);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [hasMore, setHasMore] = useState(true);

  const handleLoadMore = () => {
    startTransition(async () => {
      const next = page + 1;
      const more = await loadMore(next);
      if (!more?.length) {
        setHasMore(false);
      } else {
        setDramas((prev) => [...prev, ...more]);
        setPage(next);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {dramas.map((drama, i) => (
          <Card
            key={`${drama.id}-${i}`}
            data={{
              title: drama.title,
              image: drama.image,
              description: drama.status ?? "",
              slug: drama.id,
            }}
            aspectRatio="portrait"
            width={160}
            height={220}
            className="w-full"
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={isPending} variant="outline" size="lg" className="min-w-[180px] gap-2">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
              : <><ChevronDown className="w-4 h-4" /> Load More</>
            }
          </Button>
        </div>
      )}
    </div>
  );
}
