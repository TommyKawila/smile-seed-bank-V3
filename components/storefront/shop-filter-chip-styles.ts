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
      : "border-zinc-200/80 bg-white text-zinc-600 hover:border-primary/25 hover:bg-primary/5"
  );
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
