import { CountryDramaPage, buildMetadata } from "../page-template";
import type { CountryConfig } from "../page-template";

const cfg: CountryConfig = {
  country: "China",
  label: "Chinese",
  flag: "🇨🇳",
  color: "bg-gradient-to-b from-[#2d0d0d] via-[#0f1117] to-[#0f1117]",
  accentColor: "red-400",
  description: "Epic historical sagas, wuxia fantasy, and modern romances. Chinese dramas offer some of the most spectacular production values in Asian entertainment.",
  genres: ["Historical", "Wuxia", "Romance", "Fantasy", "Political", "Martial Arts", "Modern", "Ancient", "Xianxia", "Business"],
  funFacts: [
    "C-dramas can run 40–80 episodes",
    "Wuxia genre dates back to 1920s literature",
    "The Story of Yanxi Palace was most Googled show in 2018",
    "Chinese streaming platforms have 1 billion+ users",
    "'Ancient costume dramas' are the most popular genre",
  ],
};

export const metadata = buildMetadata(cfg);
export default function Page() { return <CountryDramaPage cfg={cfg} />; }
