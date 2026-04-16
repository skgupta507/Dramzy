import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// Static robots.txt — no need for dynamic headers in Next.js 15
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/signout"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
