import { NextRequest, NextResponse } from "next/server";
import { loadAdminOrderDetail } from "@/lib/load-admin-order-detail";
import { listOrderLogs } from "@/lib/order-logs";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const [detail, activityLogs] = await Promise.all([
      loadAdminOrderDetail(orderId),
      listOrderLogs(orderId),
    ]);
    if (!detail) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { lineUserId, ...rest } = detail;
    return NextResponse.json(
      bigintToJson({
        ...rest,
        lineUserId,
        activityLogs,
      })
    );
  } catch (err) {
    console.error("[orders/[id]]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
