import type { LucideIcon } from "lucide-react";
import Blend from "lucide-react/dist/esm/icons/blend";
import Moon from "lucide-react/dist/esm/icons/moon";
import Sprout from "lucide-react/dist/esm/icons/sprout";
import Sun from "lucide-react/dist/esm/icons/sun";
import Zap from "lucide-react/dist/esm/icons/zap";
import { cn } from "@/lib/utils";

export type SeedsFilterIconSlug =
  | "sativa-dom"
  | "indica-dom"
  | "hybrid"
  | "auto"
  | "photo"
  | "photo-ff";

export const SEEDS_FILTER_ICON_CONFIG: Record<
  SeedsFilterIconSlug,
  { Icon: LucideIcon }
> = {
  "sativa-dom": { Icon: Sun },
  "indica-dom": { Icon: Moon },
  hybrid: { Icon: Blend },
  auto: { Icon: Zap },
  photo: { Icon: Sprout },
  "photo-ff": { Icon: Zap },
};

export function SeedsFilterIconBadge({
  slug,
  active = false,
  size = "md",
}: {
  slug: string;
  active?: boolean;
  size?: "sm" | "md";
}) {
  const cfg = SEEDS_FILTER_ICON_CONFIG[slug as SeedsFilterIconSlug];
  if (!cfg) return null;
  const { Icon } = cfg;
  const box = size === "sm" ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border",
        box,
        active
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-transparent"
      )}
    >
      <Icon
        className={cn(icon, active ? "text-primary" : "text-zinc-500")}
        strokeWidth={1.75}
        aria-hidden
      />
    </span>
  );
}
