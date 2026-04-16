import { SectionHeading } from "@/components/ui/section-heading";
import { getTrending } from "@/lib/dramacool";
import { generateMetadata } from "@/lib/utils";
import { PopularGrid } from "./client";

const title = "Popular";
const description = "The most-watched Korean dramas blazing through the realm right now.";
export const metadata = generateMetadata({ title, description });

export default async function PopularPage() {
  const data = await getTrending();
  const dramas = data?.results ?? [];

  return (
    <section className="mx-auto w-screen px-4 py-8 lg:container lg:py-12">
      <SectionHeading
        title="Popular Dramas"
        subtitle="The most watched dramas blazing through the realm right now"
        slogan="The realm burns brightest here"
        className="mb-8"
      />
      <PopularGrid initial={dramas} />
    </section>
  );
}
