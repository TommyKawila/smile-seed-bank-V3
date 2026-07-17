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
  { Icon: LucideIcon; iconBg: string; iconFg: string }
> = {
  "sativa-dom": {
    Icon: Sun,
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    iconFg: "text-emerald-400",
  },
  "indica-dom": {
    Icon: Moon,
    iconBg: "bg-indica/15 border-indica/25",
    iconFg: "text-indica",
  },
  hybrid: {
    Icon: Blend,
    iconBg: "bg-teal-500/15 border-teal-500/25",
    iconFg: "text-teal-400",
  },
  auto: {
    Icon: Zap,
    iconBg: "bg-amber-500/15 border-amber-500/25",
    iconFg: "text-amber-400",
  },
  photo: {
    Icon: Sprout,
    iconBg: "bg-primary/15 border-primary/25",
    iconFg: "text-primary",
  },
  "photo-ff": {
    Icon: Zap,
    iconBg: "bg-orange-500/15 border-orange-500/25",
    iconFg: "text-orange-400",
  },
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
  const { Icon, iconBg, iconFg } = cfg;
  const box = size === "sm" ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border shadow-sm backdrop-blur-sm",
        box,
        active ? "border-white/30 bg-white/20" : iconBg
      )}
    >
      <Icon
        className={cn(icon, active ? "text-primary-foreground" : iconFg)}
        strokeWidth={1.75}
        aria-hidden
      />
    </span>
  );
}
