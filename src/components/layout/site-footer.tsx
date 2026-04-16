import Link from "next/link";
import { Github, Twitter, Zap } from "lucide-react";

const SOCIAL_LINKS = [
  { id: "twitter", icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { id: "github", icon: Github, href: "https://github.com", label: "GitHub" },
];

const NAV_LINKS = [
  { label: "Home", href: "/home" },
  { label: "Popular", href: "/popular" },
  { label: "Search", href: "/search" },
];

const LEGAL_LINKS = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
              { label: "DMCA", href: "/dmca" },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border/40 bg-[#0c0f16]">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white fill-white" strokeWidth={2} />
              </div>
              <span className="font-heading text-lg text-white tracking-widest">DRAMZY</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              The premier destination for Korean drama. Stream romance, thriller, revenge, and fantasy — free forever.
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ id, icon: Icon, href, label }) => (
                <Link
                  key={id}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-brand-400 hover:border-brand-700/50 transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Browse */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground tracking-widest uppercase">Browse</h4>
            <ul className="space-y-2">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground tracking-widest uppercase">Legal</h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dramzy. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/50 tracking-widest">
            CRAFTED BY <span className="text-brand-500">SUNIL</span> • DRAMZY
          </p>
        </div>
      </div>
    </footer>
  );
}
