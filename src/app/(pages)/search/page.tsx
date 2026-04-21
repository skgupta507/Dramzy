import { Card } from "@/components/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { search } from "@/lib/dramacool";
import { Flame, Search, X } from "@/components/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { generateMetadata as genMeta } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the abyss for your next K-Drama obsession.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await search(query) : null;

  return (
    <section className="mx-auto w-screen px-4 py-8 lg:container lg:py-12">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4 text-brand-600" strokeWidth={1.5} />
          <h1 className="font-heading font-bold text-2xl text-white tracking-wide glow-text-subtle">
            Search the Realm
          </h1>
        </div>
        <p className="text-muted-foreground text-sm font-sans pl-6">
          Enter a drama title, genre, or actor to uncover your next obsession.
        </p>
      </div>

      {/* Search form */}
      <form
        action={async (data: FormData) => {
          "use server";
          const q = (data.get("q") as string) ?? "";
          redirect(`/search?q=${encodeURIComponent(q)}`);
        }}
        className="flex gap-2 max-w-xl mb-10"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search dramas..."
            className="pl-9 pr-4 h-10"
            autoFocus
          />
        </div>
        <Button type="submit" variant="ember" size="default">
          Search
        </Button>
        {query && (
          <Link href="/search">
            <Button variant="outline" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </form>

      {/* Results */}
      {query && results && (
        <div className="space-y-4">
          <SectionHeading
            title={`Results for "${query}"`}
            subtitle={`${results.results?.length ?? 0} dramas found in the abyss`}
          />
          {(!results.results || results.results.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-12 h-12 rounded-sm border border-brand-900/40 bg-brand-950/20 flex items-center justify-center">
                <Search className="w-6 h-6 text-brand-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-heading text-white text-sm">No dramas found</p>
                <p className="text-muted-foreground text-xs mt-1 font-sans">
                  Try a different title or check your spelling
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {results.results.map((drama, i) => (
                <Card
                  key={i}
                  data={{
                    title: drama.title,
                    image: drama.image,
                    description: drama.status ?? "",
                    slug: drama.id.replace("drama-detail/", ""),
                  }}
                  aspectRatio="portrait"
                  width={160}
                  height={220}
                  className="w-full"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <Flame className="w-10 h-10 text-brand-700 animate-flicker" strokeWidth={1.5} />
          <p className="font-heading text-white text-sm tracking-wider">AWAITING YOUR QUERY</p>
          <p className="text-muted-foreground text-xs font-sans max-w-xs">
            Type above to search thousands of Korean dramas across all genres
          </p>
        </div>
      )}
    </section>
  );
}
