import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/services/order-service";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("order")?.trim();
  if (!orderNumber || orderNumber.length < 4 || orderNumber.length > 20) {
    return NextResponse.json({ error: "Invalid order number" }, { status: 400 });
  }

  const { data, error } = await getOrderByNumber(orderNumber);

  if (error === "Order not found") {
    return NextResponse.json({ error }, { status: 404 });
  }
  if (error || !data) {
    return NextResponse.json({ error: error ?? "Server error" }, { status: 500 });
  }

  return NextResponse.json(data);
}
