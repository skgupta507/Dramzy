import { CountryDramaPage, buildMetadata } from "../page-template";
import type { CountryConfig } from "../page-template";

const cfg: CountryConfig = {
  country: "Thailand",
  label: "Thai",
  flag: "🇹🇭",
  color: "bg-gradient-to-b from-[#0d2d1a] via-[#0f1117] to-[#0f1117]",
  accentColor: "green-400",
  description: "Known for heartwarming BL series, intense revenge dramas, and supernatural thrillers. Thai dramas have built one of the most passionate global fanbases.",
  genres: ["BL", "Romance", "Thriller", "Supernatural", "Horror", "School", "Action", "Comedy", "Revenge", "Fantasy"],
  funFacts: [
    "Thai BL dramas have global fandoms across 50+ countries",
    "GMMTV produces over 20 dramas per year",
    "Thai lakorn (soap opera) tradition dates to 1970s",
    "2gether became Thailand's most watched drama internationally",
    "Thai dramas often adapt manga and novels",
  ],
};

export const metadata = buildMetadata(cfg);
export default function Page() { return <CountryDramaPage cfg={cfg} />; }
