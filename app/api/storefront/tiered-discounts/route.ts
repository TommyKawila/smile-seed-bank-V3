import { NextResponse } from "next/server";
import { getActiveTieredDiscountRules } from "@/lib/active-tiered-discount-rules";

export const dynamic = "force-dynamic";

/** No hardcoded discounts — empty when no matching `promotion_rules`. */
const FALLBACK: { min_spend: number; discount_percent: number }[] = [];

export async function GET() {
  try {
    const rules = await getActiveTieredDiscountRules();
    if (rules.length > 0) return NextResponse.json(rules);
    return NextResponse.json(FALLBACK);
  } catch (e) {
    console.error("GET tiered-discounts (promotion_rules):", e);
    return NextResponse.json(FALLBACK);
  }
}
