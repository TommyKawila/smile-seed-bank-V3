import { prisma } from "@/lib/prisma";
import type { TieredDiscountRule } from "@/lib/discount-utils";

/** Active spend-based rules from `promotion_rules` (same logic as GET /api/storefront/tiered-discounts). */
export async function getActiveTieredDiscountRules(): Promise<TieredDiscountRule[]> {
  const now = new Date();
  const list = await prisma.promotion_rules.findMany({
    where: {
      type: "DISCOUNT",
      is_active: true,
      start_date: { lte: now },
      end_date: { gte: now },
    },
    orderBy: { start_date: "desc" },
  });

  const rules = list
    .filter((p) => {
      const c = (p.conditions ?? {}) as Record<string, unknown>;
      const minSpend = typeof c.min_spend === "number" ? c.min_spend : Number(c.min_spend) || 0;
      const discountType = String(c.discount_type ?? "FIXED").toUpperCase();
      return minSpend > 0 && discountType === "PERCENTAGE";
    })
    .map((p) => {
      const c = (p.conditions ?? {}) as Record<string, unknown>;
      const minSpend = typeof c.min_spend === "number" ? c.min_spend : Number(c.min_spend) || 0;
      const percent =
        typeof p.discount_value === "number" ? p.discount_value : Number(p.discount_value ?? 0);
      return { min_spend: minSpend, discount_percent: percent };
    })
    .sort((a, b) => a.min_spend - b.min_spend);

  return rules;
}
