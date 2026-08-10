import { cn } from "@/lib/utils";

/** Shared pill styles for shop sticky filter rows (quick bar + ft / genetics). */
export const shopQuickChipBase =
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function shopQuickChipClasses(active: boolean, compact = false): string {
  return cn(
    compact
      ? "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      : shopQuickChipBase,
    active
      ? "border-primary bg-primary text-white shadow-sm"
      : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:bg-primary/5"
  );
}

export function shopCategoryQuickChipClasses(
  category: "new" | "clearance",
  compact = false
): string {
  const base = compact
    ? "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    : shopQuickChipBase;
  const tokens =
    category === "new"
      ? { idle: "border-violet-500/35 bg-card text-violet-300/90 hover:border-violet-400/50 hover:bg-violet-500/10" }
      : { idle: "border-orange-500/35 bg-card text-orange-300/90 hover:border-orange-400/50 hover:bg-orange-500/10" };
  return cn(base, tokens.idle);
}

export function shopFilterChipLeadingGlyph(slug: string): string | null {
  switch (slug) {
    case "sativa-dom":
      return "🌿";
    case "indica-dom":
      return "💜";
    case "hybrid":
      return "⚖️";
    case "auto":
      return "🚀";
    case "photo":
      return "🌱";
    case "photo-ff":
      return "⚡";
    case "photo-3n":
      return "🧬";
    default:
      return null;
  }
}
