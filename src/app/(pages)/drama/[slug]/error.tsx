"use client";
import Link from "next/link";
import { Flame } from "@/components/icons";

export default function DramaError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <Flame className="w-12 h-12 text-brand-700 mx-auto" strokeWidth={1.5} />
        <h1 className="font-heading text-2xl text-white tracking-wide">Drama Not Found</h1>
        <p className="text-sm text-muted-foreground">
          This drama couldn&apos;t be loaded. It may have moved or the source is temporarily unavailable.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link href="/popular" className="px-4 py-2 border border-white/15 text-white/70 hover:text-white text-sm rounded-lg transition-colors">
            Browse dramas
          </Link>
        </div>
      </div>
    </div>
  );
}
