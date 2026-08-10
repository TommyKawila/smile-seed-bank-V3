import { Skeleton } from "@/components/ui/Skeleton";

function OrderRowSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28 bg-zinc-800" />
          <Skeleton className="h-3 w-20 bg-zinc-800" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full bg-zinc-800" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3.5 w-16 bg-zinc-800" />
        <Skeleton className="h-3.5 w-24 bg-zinc-800" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pt-24 pb-20">
      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-zinc-950/40 p-5">
        <Skeleton className="h-14 w-14 rounded-full bg-zinc-800" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-zinc-800" />
          <Skeleton className="h-3 w-44 bg-zinc-800" />
        </div>
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg bg-zinc-800" />
        <Skeleton className="h-10 flex-1 rounded-lg bg-zinc-800" />
        <Skeleton className="h-10 flex-1 rounded-lg bg-zinc-800" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <OrderRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
