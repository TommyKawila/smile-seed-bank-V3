import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bone,
  Bug,
  CircleDot,
  Cylinder,
  Droplets,
  Feather,
  Flame,
  Gem,
  Layers,
  Leaf,
  ListOrdered,
  Package,
  Recycle,
  ShoppingBag,
  Shovel,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import { SOIL_MATERIAL_OPTIONS } from "@/lib/grower-tools";

export type SoilMaterialId = (typeof SOIL_MATERIAL_OPTIONS)[number]["id"];

export const SOIL_MATERIAL_ICONS: Record<SoilMaterialId, LucideIcon> = {
  coco: CircleDot,
  peat: Leaf,
  compost: Recycle,
  worm: Bug,
  perlite: Sparkles,
  vermiculite: Gem,
  biochar: Flame,
  bone: Bone,
  blood: Droplets,
  kelp: Waves,
  lime: Layers,
  gypsum: Package,
  guano: Feather,
  topsoil: Shovel,
};

export const SOIL_SECTION_ICONS = {
  pot: Cylinder,
  super: Layers,
  base: Package,
  missing: AlertTriangle,
  buy: ShoppingBag,
  prep: ListOrdered,
  basic: Sparkles,
  advance: Zap,
} as const;

export function getSoilMaterialIcon(idOrName: string): LucideIcon {
  const lower = idOrName.toLowerCase().trim();
  const byId = SOIL_MATERIAL_ICONS[lower as SoilMaterialId];
  if (byId) return byId;

  for (const m of SOIL_MATERIAL_OPTIONS) {
    const en = m.labelEn.toLowerCase();
    const th = m.labelTh.toLowerCase();
    if (
      m.id === lower ||
      en === lower ||
      th === lower ||
      en.includes(lower) ||
      lower.includes(en) ||
      th.includes(lower) ||
      lower.includes(th)
    ) {
      return SOIL_MATERIAL_ICONS[m.id];
    }
  }
  return Leaf;
}
