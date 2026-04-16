/**
 * Normalises any ID/URL that the Xyra API returns into a clean slug
 * suitable for use in /drama/[slug] and /watch/[slug] routes.
 *
 * Handles:
 *   "https://dramacool.sh/catch-your-luck-2025"  → "catch-your-luck-2025"
 *   "https://dramacool.sh/watch/some-ep-episode-3-english-subbed" → "some-ep-episode-3-english-subbed"
 *   "drama-detail/catch-your-luck-2025"           → "catch-your-luck-2025"
 *   "catch-your-luck-2025"                        → "catch-your-luck-2025"
 */
export function toSlug(id: string): string {
  if (!id) return "";

  // Full URL — extract the last path segment
  if (id.startsWith("http://") || id.startsWith("https://")) {
    try {
      const pathname = new URL(id).pathname;
      // Strip leading slash, take last non-empty segment
      const parts = pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? id;
    } catch {
      // URL parse failed — strip protocol manually
      const afterProto = id.replace(/^https?:\/\/[^/]+\//, "");
      const parts = afterProto.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? id;
    }
  }

  // "drama-detail/slug" format
  if (id.startsWith("drama-detail/")) {
    return id.replace("drama-detail/", "");
  }

  // Already a clean slug
  return id;
}

/**
 * Converts a slug back to the full drama-detail ID the Xyra /info endpoint expects.
 * e.g. "catch-your-luck-2025" → "drama-detail/catch-your-luck-2025"
 */
export function toDramaId(slug: string): string {
  if (slug.startsWith("drama-detail/")) return slug;
  if (slug.startsWith("http")) return slug; // pass through, API may accept full URLs
  return `drama-detail/${slug}`;
}
