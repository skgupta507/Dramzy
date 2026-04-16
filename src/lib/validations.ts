import { z } from "zod";

// ─── Episode inside /info response ───────────────────────────────────────────
export const episodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  episode: z.number(),
  subType: z.enum(["SUB", "DUB", "RAW"]).catch("SUB"),
  releaseDate: z.string().default(""),
  url: z.string().optional(),
});

// ─── Full drama info from /info ───────────────────────────────────────────────
export const infoSchema = z.object({
  id: z.string(),
  title: z.string(),
  otherNames: z.array(z.string()).optional(),
  image: z.string(),
  description: z.string().default(""),
  _status: z
    .string()
    .toLowerCase()
    .pipe(z.enum(["completed", "upcoming", "ongoing"]))
    .optional()
    .catch(undefined),
  genres: z.array(z.string()).optional(),
  releaseDate: z.coerce.number().optional(),
  episodes: z.array(episodeSchema).optional(),
});

// ─── Streaming sources from /stream ──────────────────────────────────────────
const sourceSchema = z.object({
  url: z.string(),
  isM3U8: z.boolean().default(false),
  quality: z.string().optional(),
});

const subtitleSchema = z.object({
  url: z.string(),
  lang: z.string(),
});

export const episodeSourceSchema = z.object({
  sources: z.array(sourceSchema),
  subtitles: z.array(subtitleSchema).optional(),
  embedUrl: z.string().optional(),
});
