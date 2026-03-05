import { Skeleton } from "@/components/ui/Skeleton";

function OrderRowSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-24" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pt-24 pb-20">
      {/* User header */}
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <OrderRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
