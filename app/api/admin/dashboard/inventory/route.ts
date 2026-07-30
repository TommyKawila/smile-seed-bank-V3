import { requireAdminUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { getInventoryValue } from "@/services/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
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
