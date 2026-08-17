import { cn } from "@/lib/utils";

/** Idle = zinc only. Active = emerald (site primary). Shared by shop / seeds / new / clearance. */
export const FILTER_IDLE =
  "border-border bg-transparent text-muted-foreground hover:border-zinc-600 hover:bg-zinc-900/40 hover:text-zinc-200";
export const FILTER_ACTIVE =
  "border-primary/50 bg-primary/10 text-primary";

const chipFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

/** Shared pill styles for shop sticky filter rows (quick bar + ft / genetics). */
export const shopQuickChipBase = cn(
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
  chipFocus
);

export function shopQuickChipClasses(active: boolean, compact = false): string {
  return cn(
    compact
      ? cn(
          "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors",
          chipFocus
        )
      : shopQuickChipBase,
    active ? FILTER_ACTIVE : FILTER_IDLE
  );
}

export function shopCategoryQuickChipClasses(
  _category: "new" | "clearance",
  compact = false,
  active = false
): string {
  return shopQuickChipClasses(active, compact);
}

export function catalogFilterRowClass(on: boolean, opts?: { mobile?: boolean; isZero?: boolean }): string {
  const mobile = opts?.mobile === true;
  return cn(
    mobile
      ? "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 font-sans transition-colors active:scale-[0.98]"
      : "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-sans transition-colors",
    opts?.isZero && "opacity-55",
    on ? FILTER_ACTIVE : FILTER_IDLE
  );
}

export function catalogFilterToggleClass(on: boolean): string {
  return cn(
    "h-9 rounded-full border bg-card px-3 text-foreground shadow-sm",
    on ? FILTER_ACTIVE : "border-border"
  );
}

export function catalogMobileDockBtnClass(on: boolean): string {
  return cn(
    "h-14 min-h-12 flex-1 gap-2 rounded-xl border text-base font-semibold shadow-none transition-colors active:scale-[0.98]",
    on ? FILTER_ACTIVE : "border-border bg-card text-foreground hover:border-zinc-600 hover:bg-zinc-900/40"
  );
}

export function shopFilterChipLeadingGlyph(_slug: string): string | null {
  return null;
}
