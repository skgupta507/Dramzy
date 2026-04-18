"use client";

import { useState } from "react";
import { Flame, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbedPlayerProps {
  src: string;
  title: string;
}

export function EmbedPlayer({ src, title }: EmbedPlayerProps) {
  const [key, setKey] = useState(0);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full bg-black">
      {!error ? (
        <iframe
          key={key}
          src={src}
          title={title}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      ) : (
        <div className="size-full flex items-center justify-center">
          <div className="text-center space-y-4 px-8">
            <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
            <p className="font-heading text-sm text-white tracking-wider">PLAYER ERROR</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              The embedded player failed to load. This may be due to an ad blocker or network issue.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setError(false); setKey((k) => k + 1); }}
              className="gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
