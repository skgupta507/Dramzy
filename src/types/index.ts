// ─── Navigation / Config ──────────────────────────────────────────────────────
export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type MainNavItem = NavItem;

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  links: { twitter: string; github: string };
  mainNav: { title: string; href: string }[];
};

// ─── Xyra Stream API — shared primitives ─────────────────────────────────────

/** A drama card as returned by /home, /popular, /latest, /search, etc. */
export interface XyraDramaCard {
  id: string;           // e.g. "drama-detail/some-drama-slug"
  title: string;
  image: string;
  url?: string;
  status?: string;      // "Ongoing" | "Completed" | "Upcoming"
  type?: string;        // "KDrama" | "Movie" etc.
}

/** An episode entry inside /info */
export interface XyraEpisode {
  id: string;           // episode slug — used for /stream
  title: string;
  episode: number;
  subType: "SUB" | "DUB" | "RAW";
  releaseDate: string;
  url?: string;
}

/** Full drama info from /info */
export interface XyraDramaInfo {
  id: string;
  title: string;
  image: string;
  description: string;
  otherNames?: string[];
  genres?: string[];
  releaseDate?: number | string;
  status?: "ongoing" | "completed" | "upcoming";
  episodes?: XyraEpisode[];
}

/** A streaming source */
export interface XyraSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

/** Subtitle track */
export interface XyraSubtitle {
  url: string;
  lang: string;
}

/** /stream response */
export interface XyraStreamResult {
  sources: XyraSource[];
  subtitles?: XyraSubtitle[];
  embedUrl?: string;
}

/** Paginated wrapper used by /search, /popular, /latest, /ongoing, etc. */
export interface XyraPaged<T> {
  currentPage: number;
  hasNextPage: boolean;
  results: T[];
}

// ─── Internal aliases (keeps existing code working) ──────────────────────────
export type Featured    = XyraDramaCard;
export type TopAiring   = XyraPaged<XyraDramaCard>;
export type Recent      = XyraPaged<XyraDramaCard>;
export type Search      = XyraPaged<XyraDramaCard>;

export interface EpisodeInfo {
  title: string;
  id: string;
  dramaId: string;
  number: number;
  downloadLink: string;
  episodes: {
    next: string | undefined;
    previous: string | undefined;
    list: { value: string; label: string }[];
  };
}
