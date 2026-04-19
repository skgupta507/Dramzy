import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dramzy",
    short_name: "Dramzy",
    description: "Stream the finest Korean dramas — free forever.",
    start_url: "/home",
    display: "standalone",
    background_color: "#0f1117",
    theme_color: "#0ea5e9",
    orientation: "portrait",
    categories: ["entertainment", "video"],
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        // @ts-ignore
        form_factor: "wide",
      },
    ],
  };
}
