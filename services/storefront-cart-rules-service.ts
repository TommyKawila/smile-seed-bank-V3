import "server-only";

import { prisma } from "@/lib/prisma";
import type { Promotion, ShippingRule } from "@/types/supabase";

function toNum(v: bigint | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "bigint" ? Number(v) : v;
}

/** Public cart math inputs — mirrors legacy Supabase client selects in `useCart`. */
export async function getStorefrontCartRules(): Promise<{
  shippingRules: ShippingRule[];
  promotions: Promotion[];
}> {
  const [shippingRows, promoRows] = await Promise.all([
    prisma.shipping_rules.findMany(),
    prisma.promotions.findMany({ where: { is_active: true } }),
  ]);

  return {
    shippingRules: shippingRows.map((r) => ({
      id: toNum(r.id),
      category_name: r.category_name,
      base_fee: Number(r.base_fee ?? 0),
      free_shipping_threshold: Number(r.free_shipping_threshold ?? 0),
    })),
    promotions: promoRows.map((p) => ({
      id: toNum(p.id),
      name: p.name,
      condition_type: p.condition_type ?? "",
      condition_value: p.condition_value ?? "",
      reward_variant_id: p.reward_variant_id != null ? toNum(p.reward_variant_id) : null,
      reward_quantity: p.reward_quantity ?? 1,
      is_active: p.is_active ?? true,
    })),
  };
}
