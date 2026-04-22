import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Dramzy",
  description:
    "Stream the finest Korean, Japanese, Chinese, and Thai dramas — free forever. Thousands of titles, zero subscriptions.",
  url: "https://dramzy.vercel.app",
  links: {
    twitter: "https://twitter.com/dramzy",
    github: "https://github.com/dramzy",
  },
  mainNav: [
    { title: "Home",     href: "/home" },
    { title: "Popular",  href: "/popular" },
    { title: "Korean",   href: "/dramas/korean" },
    { title: "Chinese",  href: "/dramas/chinese" },
    { title: "Thai",     href: "/dramas/thai" },
    { title: "Japanese", href: "/dramas/japanese" },
    { title: "Search",   href: "/search" },
  ],
};

export const placeholderImage = (str: string) =>
  `https://placehold.co/400x600/1a2035/475569?font=inter&text=${encodeURI(str)}`;
