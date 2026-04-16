import { type ClassValue, clsx } from "clsx";
import type { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:1999");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export function generateMetadata({
  description,
  title,
  opengraphImage,
}: {
  title: string;
  description?: string;
  opengraphImage?: string;
}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(opengraphImage ? { images: [opengraphImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
