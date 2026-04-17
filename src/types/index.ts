// ─── Navigation / Config ──────────────────────────────────────────────────────
export type NavItem = { title: string; href: string; disabled?: boolean };
export type MainNavItem = NavItem;
export type SiteConfig = {
  name: string; description: string; url: string;
  links: { twitter: string; github: string };
  mainNav: { title: string; href: string }[];
};

// ─── Xyra API types ───────────────────────────────────────────────────────────

export interface XyraDramaCard {
  id: string;
  title: string;
  image: string;
  url?: string;
  status?: string;
  type?: string;
}

export interface XyraEpisode {
  id: string;           // episode_id from /info — use as-is for /stream
  title: string;
  episode: number;
  subType: "SUB" | "DUB" | "RAW";
  releaseDate: string;
}

/** Full drama info from /info endpoint */
export interface XyraDramaInfo {
  id: string;           // drama slug
  title: string;
  image: string;        // mapped from API's "thumbnail"
  description: string;  // mapped from API's "synopsis"
  otherNames?: string[];
  genres?: string[];
  releaseDate?: number;
  status?: "ongoing" | "completed" | "upcoming";
  episodes?: XyraEpisode[];
  // Extra fields from /info
  country?: string;
  starring?: string[];
  duration?: string;
  rating?: string;
  trailer?: string;
}

export interface XyraSource { url: string; isM3U8: boolean; quality?: string }
export interface XyraSubtitle { url: string; lang: string }
export interface XyraStreamResult {
  sources: XyraSource[];
  subtitles: XyraSubtitle[];
  embedUrl?: string;
}

export interface XyraPaged<T> { currentPage: number; hasNextPage: boolean; results: T[] }

// ─── Internal aliases ─────────────────────────────────────────────────────────
export type Featured  = XyraDramaCard;
export type TopAiring = XyraPaged<XyraDramaCard>;
export type Recent    = XyraPaged<XyraDramaCard>;
export type Search    = XyraPaged<XyraDramaCard>;

export interface EpisodeInfo {
  title: string; id: string; dramaId: string; number: number; downloadLink: string;
  episodes: { next?: string; previous?: string; list: { value?: string; label?: string }[] };
}
