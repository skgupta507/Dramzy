"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { updateVideoProgress as updateProgress } from "@/lib/actions";
import { useState, useTransition } from "react";
import ReactPlayer, { type ReactPlayerProps } from "react-player";
import type { OnProgressProps } from "react-player/base";
import { Icons } from "./icons";

interface Props extends ReactPlayerProps {
  slug: string;
  number: number;
  dramaId: string;
  seekTo?: number;
}

export default function ReactPlayerAsVideo({
  slug,
  url,
  number,
  seekTo,
  dramaId,
}: Props) {
  const storageName = `dramzy-${slug}-${number}`;
  const initialMedia = JSON.stringify({
    loadedSeconds: 0,
    playedSeconds: 0,
    loaded: 0,
    played: 0,
  });

  const [media, setMedia, rmMedia] = useLocalStorage(storageName, initialMedia);
  const parsedStoredItem: OnProgressProps = JSON.parse(media);

  const [isSeeking, setIsSeeking] = useState(false);
  const [progress, setProgress] = useState<OnProgressProps>(parsedStoredItem);
  const [playbackRate, setPlaybackRate] = useLocalStorage("dramzy-playbackrate", "1");

  const seekSeconds = seekTo ?? progress.playedSeconds;
  const [_, startTransition] = useTransition();

  const handlePause = () => {
    setMedia(JSON.stringify(progress));
    startTransition(async () => {
      await updateProgress({
        episodeSlug: slug,
        seconds: String(progress.playedSeconds),
      });
    });
  };

  const handleEnded = () => {
    rmMedia();
  };

  const handleReady = (player: ReactPlayer) => {
    if (isSeeking) return;
    player.seekTo(seekSeconds);
  };

  return (
    <ReactPlayer
      url={url}
      width="100%"
      height="100%"
      controls
      loop={false}
      onEnded={handleEnded}
      onReady={handleReady}
      playbackRate={Number(playbackRate)}
      onSeek={() => setIsSeeking(true)}
      onProgress={(state) => {
        setProgress(state);
      }}
      onDuration={(duration) => {
        setProgress((prev) => ({ ...prev, loadedSeconds: duration }));
      }}
      onPause={handlePause}
      onBuffer={handlePause}
      onPlaybackRateChange={(speed: number) => {
        setPlaybackRate(String(speed));
      }}
      playIcon={<Icons.play />}
    />
  );
}
