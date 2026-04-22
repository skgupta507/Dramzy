import { CountryDramaPage, buildMetadata } from "../page-template";
import type { CountryConfig } from "../page-template";

const cfg: CountryConfig = {
  country: "Japan",
  label: "Japanese",
  flag: "🇯🇵",
  color: "bg-gradient-to-b from-[#1a0d2d] via-[#0f1117] to-[#0f1117]",
  accentColor: "purple-400",
  description: "From slice-of-life masterpieces to intense psychological thrillers. J-dramas have a unique storytelling rhythm that balances restraint with emotional depth.",
  genres: ["Slice of Life", "Thriller", "Romance", "Medical", "Legal", "School", "Manga Adaptation", "Detective", "Supernatural", "Workplace"],
  funFacts: [
    "J-dramas typically run 10–11 episodes per season",
    "Many J-dramas are adaptations of manga",
    "Fuji TV and TBS are Japan's top drama networks",
    "Hana Yori Dango inspired Korean, Chinese and Taiwanese remakes",
    "'Trendy dramas' dominated Japanese TV in the 1990s",
  ],
};

export const metadata = buildMetadata(cfg);
export default function Page() { return <CountryDramaPage cfg={cfg} />; }
