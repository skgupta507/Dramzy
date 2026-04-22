import { CountryDramaPage, buildMetadata } from "../page-template";
import type { CountryConfig } from "../page-template";

const cfg: CountryConfig = {
  country: "South Korea",
  label: "Korean",
  flag: "🇰🇷",
  color: "bg-gradient-to-b from-[#0d1b3e] via-[#0f1117] to-[#0f1117]",
  accentColor: "blue-400",
  description: "The gold standard of Asian drama. Gripping storylines, cinematic production, and performances that stay with you long after the credits roll.",
  genres: ["Romance", "Thriller", "Historical", "Medical", "Action", "Mystery", "Fantasy", "School", "Family", "Political"],
  funFacts: [
    "K-dramas typically run 16 episodes",
    "Hallyu Wave reached 100+ countries",
    "Netflix invested $2.5B in Korean content",
    "Squid Game became Netflix's #1 show globally",
    "Korean dramas pioneered the 'makjang' genre",
  ],
};

export const metadata = buildMetadata(cfg);
export default function Page() { return <CountryDramaPage cfg={cfg} />; }
