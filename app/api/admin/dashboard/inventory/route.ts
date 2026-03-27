import { NextResponse } from "next/server";
import { getInventoryValue } from "@/services/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getInventoryValue();
    if (error) {
      console.error("[Dashboard Inventory]", error);
      return NextResponse.json({
        totalValue: 0,
        lowStockCount: 0,
        totalPotentialRevenue: 0,
        potentialProfit: 0,
        potentialMarginPercent: 0,
        hasZeroCostWarning: false,
        variants: [],
        breeders: [],
      });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Dashboard Inventory]", err);
    return NextResponse.json({
      totalValue: 0,
      lowStockCount: 0,
      totalPotentialRevenue: 0,
      potentialProfit: 0,
      potentialMarginPercent: 0,
      hasZeroCostWarning: false,
      variants: [],
      breeders: [],
    });
  }
}
