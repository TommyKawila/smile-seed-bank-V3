"use client";

import { cn } from "@/lib/utils";

export type OrderFilterTab<TId extends string = string, TCountKey extends string = string> = {
  id: TId;
  label: string;
  countKey: TCountKey | null;
};

export function OrderFilters<TId extends string, TCountKey extends string>({
  tabs,
  activeTab,
  counts,
  onTabChange,
}: {
  tabs: OrderFilterTab<TId, TCountKey>[];
  activeTab: TId;
  counts?: Partial<Record<TCountKey, number>>;
  onTabChange: (tab: TId) => void;
}) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:rounded-lg sm:bg-zinc-100 sm:p-1">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        const count =
          tab.countKey != null
            ? counts?.[tab.countKey] ?? 0
            : counts
              ? (Object.values(counts) as number[]).reduce((a, b) => a + b, 0)
              : 0;
        return (
          <button
            key={tab.id || "all"}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:rounded-md sm:py-1.5",
              active ? "bg-primary text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 sm:bg-transparent"
            )}
          >
            {tab.label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-xs", active ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
