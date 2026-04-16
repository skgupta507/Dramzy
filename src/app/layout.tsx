import { Analytics } from "@/components/analytics";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { fontHeading, fontMono, fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0f1117",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s • ${siteConfig.name}` },
  description: siteConfig.description,
  keywords: ["Korean Drama", "K-Drama", "Dramzy", "Watch Online", "Streaming"],
  authors: [{ name: "Sunil" }],
  creator: "Sunil",
  openGraph: { type: "website", locale: "en_US", url: siteConfig.url, title: siteConfig.name, description: siteConfig.description, siteName: siteConfig.name },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description },
  icons: { shortcut: "/favicon-16x16.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn(fontSans.variable, fontMono.variable, fontHeading.variable, "min-h-screen bg-[#0f1117] font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          {children}
          <TailwindIndicator />
          <Analytics />
          <Toaster toastOptions={{ style: { background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f4f8" } }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
