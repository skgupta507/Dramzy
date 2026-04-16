"use client";

import dynamic from "next/dynamic";
import type { ReactPlayerProps } from "react-player";
import { Flame } from "lucide-react";

const ReactPlayerAsVideo = dynamic(
  () => import("@/components/react-player"),
  {
    ssr: false,
    loading: () => (
      <div className="size-full bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Flame className="w-8 h-8 text-brand-600 animate-flicker mx-auto" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground tracking-widest font-heading">
            LOADING STREAM…
          </p>
        </div>
      </div>
    ),
  }
);

interface VideoPlayerWrapperProps extends ReactPlayerProps {
  slug: string;
  number: number;
  dramaId: string;
  seekTo?: number;
}

export function VideoPlayerWrapper(props: VideoPlayerWrapperProps) {
  return <ReactPlayerAsVideo {...props} />;
}
