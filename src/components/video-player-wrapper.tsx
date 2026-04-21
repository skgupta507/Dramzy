"use client";

import dynamic from "next/dynamic";
import type { ReactPlayerProps } from "react-player";

const ReactPlayerAsVideo = dynamic(
  () => import("@/components/react-player"),
  { ssr: false }
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
