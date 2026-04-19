"use client";

import { useState } from "react";
import { Flame, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbedPlayerInnerProps {
  src: string;
  title: string;
}

export default function EmbedPlayerInner({ src, title }: EmbedPlayerInnerProps) {
  const [key, setKey] = useState(0);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="size-full bg-black flex items-center justify-center">
        <div className="text-center space-y-4 px-8">
          <Flame className="w-10 h-10 text-brand-700 mx-auto" strokeWidth={1.5} />
          <p className="font-heading text-sm text-white tracking-wider">PLAYER ERROR</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            The player failed to load. This may be due to an ad blocker or network issue.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => { setErrored(false); setKey((k) => k + 1); }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        key={key}
        src={src}
        title={title}
        className="w-full h-full border-0 block"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
