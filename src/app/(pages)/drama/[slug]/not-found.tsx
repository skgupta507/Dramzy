import Link from "next/link";
import { Flame, Search } from "@/components/icons";

export default function DramaNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="relative mx-auto w-16 h-16">
          <Flame className="w-16 h-16 text-brand-800 mx-auto" strokeWidth={1} />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl text-white tracking-wide">Drama Not Found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This drama isn&apos;t indexed yet or may have moved. Try searching for it directly.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <Link href="/search" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-lg transition-colors">
            <Search className="w-3.5 h-3.5" /> Search Dramas
          </Link>
          <Link href="/popular" className="px-4 py-2 border border-white/15 text-white/70 hover:text-white text-sm rounded-lg transition-colors">
            Browse Popular
          </Link>
        </div>
      </div>
    </div>
  );
}
