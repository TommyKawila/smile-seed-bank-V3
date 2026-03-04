import { NextRequest, NextResponse } from "next/server";
import { getAvailableCoupons } from "@/lib/services/coupon-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subtotal = Number(searchParams.get("subtotal")) || 0;
  const email = searchParams.get("email")?.trim() || null;

  const coupons = await getAvailableCoupons(subtotal, email);
  return NextResponse.json(coupons);
}
