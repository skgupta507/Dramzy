"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { updateWatchlist } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

interface UpdateWatchlistButtonProps extends ButtonProps {
  slug: string;
  episode: number;
  watched: boolean;
}

export default function UpdateWatchlistButton({
  episode,
  slug,
  watched,
  className,
  ...props
}: UpdateWatchlistButtonProps) {
  const router = useRouter();
  const [isWatched, setIsWatched] = React.useState(watched);
  const [isPending, startTransition] = React.useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const next = !isWatched;
      setIsWatched(next);
      const res = await updateWatchlist({ episode, slug, watched });
      if (res.error) {
        toast.error(res.error);
        setIsWatched(!next); // revert
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      disabled={isPending}
      variant={isWatched ? "secondary" : "outline"}
      className={cn("gap-1.5 text-xs", className)}
    >
      {isWatched ? (
        <><CheckCircle2 className="w-3.5 h-3.5 text-brand-500" /> Watched</>
      ) : (
        <><Circle className="w-3.5 h-3.5" /> Mark Watched</>
      )}
    </Button>
  );
}
