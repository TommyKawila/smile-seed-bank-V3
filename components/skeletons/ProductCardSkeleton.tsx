import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className
      )}
    >
      <Skeleton className="aspect-square w-full rounded-b-none rounded-t-2xl" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-16 rounded-md" />
        <Skeleton className="h-4 w-[88%] max-w-[14rem] rounded-md" />
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-10 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-8 w-14 shrink-0 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
