import { cn } from "@/lib/utils";

/** Shared pill styles for shop sticky filter rows (quick bar + ft / genetics). */
export const shopQuickChipBase =
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/35";

export function shopQuickChipClasses(active: boolean, compact = false): string {
  return cn(
    compact
      ? "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/35"
      : shopQuickChipBase,
    active
      ? "border-zinc-600 bg-zinc-800/80 text-zinc-100"
      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/70 hover:text-zinc-300"
  );
}

export function shopCategoryQuickChipClasses(
  category: "new" | "clearance",
  compact = false
): string {
  const base = compact
    ? "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/35"
    : shopQuickChipBase;
  const tokens =
    category === "new"
      ? { idle: "border-violet-500/25 bg-transparent text-violet-400/80 hover:border-violet-500/40 hover:bg-violet-500/5" }
      : { idle: "border-orange-500/25 bg-transparent text-orange-400/80 hover:border-orange-500/40 hover:bg-orange-500/5" };
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
