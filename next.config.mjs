import "./src/env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    // Allow all external image sources from common drama CDNs
    remotePatterns: [
      { hostname: "imagecdn.me" },
      { hostname: "dramacool.sh" },
      { hostname: "www.dramacool.sh" },
      { hostname: "asianc.org" },
      { hostname: "dramacdn.me" },
      { hostname: "i.imgur.com" },
      { hostname: "img.dramacool.sh" },
      { hostname: "kissasian.sh" },
      { hostname: "via.placeholder.com" },
      { hostname: "placehold.co" },
    ],
    // If an image domain isn't in the list above, unoptimized: true
    // lets Next.js still serve it (avoids 400 errors on unknown CDNs)
    unoptimized: true,
  },
};

export default nextConfig;
