import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK: { min_spend: number; discount_percent: number }[] = [
  { min_spend: 2000, discount_percent: 10 },
  { min_spend: 4000, discount_percent: 20 },
];

export async function GET() {
  try {
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
        const percent = typeof p.discount_value === "number" ? p.discount_value : Number(p.discount_value ?? 0);
        return { min_spend: minSpend, discount_percent: percent };
      })
      .sort((a, b) => a.min_spend - b.min_spend);

    if (rules.length > 0) return NextResponse.json(rules);
    return NextResponse.json(FALLBACK);
  } catch (e) {
    console.error("GET tiered-discounts (promotion_rules):", e);
    return NextResponse.json(FALLBACK);
  }
}
