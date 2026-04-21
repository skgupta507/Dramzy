"use client";

import { Button } from "@/components/ui/button";
import { Flame, RotateCcw } from "@/components/icons";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm px-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-sm border border-brand-900/40 bg-brand-950/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-brand-600" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-bold text-white">The Realm is Unstable</h2>
          <p className="text-muted-foreground text-sm font-sans">
            Something went wrong fetching dramas from the abyss. Please try again.
          </p>
        </div>
        <Button onClick={reset} variant="ember">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
