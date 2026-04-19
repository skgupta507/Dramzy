"use client";

import dynamic from "next/dynamic";
import { Flame } from "lucide-react";

// Dynamic import from a real module path — the only pattern Next.js Webpack handles reliably
export const EmbedPlayer = dynamic(
  () => import("@/components/embed-player-inner"),
  {
    ssr: false,
    loading: () => (
      <div className="size-full bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Flame className="w-8 h-8 text-brand-600 animate-flicker mx-auto" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground tracking-widest font-heading">
            LOADING PLAYER…
          </p>
        </div>
      </div>
    ),
  }
);
