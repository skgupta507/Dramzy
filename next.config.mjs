import "./src/env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  logging: { fetches: { fullUrl: true } },

  // ── Image optimisation ──────────────────────────────────────────────────
  // Vercel Hobby: 1,000 image optimisations/month.
  // Strategy: let Vercel optimise our own public/ assets (placeholder.svg etc.)
  // but serve ALL external drama CDN images as-is (unoptimized).
  // External drama images are already CDN-served and change constantly —
  // Vercel would burn through quota optimising them.
  images: {
    // Domains we allow Vercel to optimise (our own assets only)
    remotePatterns: [
      { protocol: "https", hostname: "dramzy.vercel.app" },
    ],
    // Limit sizes generated to just what we actually use
    // This prevents Vercel from generating unused image variants
    deviceSizes: [640, 1080, 1920],
    imageSizes: [128, 256, 384],
    formats: ["image/webp"],
    // Don't optimize external drama images — use them directly from CDN
    // (we use unoptimized prop on all <Image> components with external src)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Performance ─────────────────────────────────────────────────────────
  // Compress responses (Vercel does this automatically but good to have)
  compress: true,

  // ── Headers ─────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/(.*\\.(?:js|css|woff2|woff|ttf|ico|svg|png|jpg|jpeg|webp))",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Drama pages: cache for 10 minutes on CDN, always serve stale while revalidating
        source: "/drama/:slug*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=86400" }],
      },
      {
        // Popular/home: cache for 5 minutes
        source: "/(home|popular)",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=3600" }],
      },
    ];
  },
};

export default nextConfig;
