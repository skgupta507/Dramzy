import { Skeleton } from "@/components/ui/skeleton";

export function FallBackCard() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="w-28 shrink-0 lg:w-[180px] space-y-2">
          <Skeleton className="w-full aspect-[3/4] rounded-sm" />
          <Skeleton className="h-3 w-3/4 rounded-sm" />
          <Skeleton className="h-2.5 w-1/2 rounded-sm" />
        </div>
      ))}
    </>
  );
}
