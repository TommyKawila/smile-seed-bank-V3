import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-violet-500/20 bg-zinc-950 shadow-lg",
        className
      )}
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-3">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-4 w-[88%] max-w-[14rem] rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
        <div className="flex items-end justify-between gap-3 border-t border-zinc-800 pt-2">
          <Skeleton className="h-5 w-20 rounded-md" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}
