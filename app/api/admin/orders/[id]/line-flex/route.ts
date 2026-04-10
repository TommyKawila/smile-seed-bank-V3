import { NextRequest, NextResponse } from "next/server";
import { getSiteOrigin } from "@/lib/get-url";
import { loadAdminOrderDetail } from "@/lib/load-admin-order-detail";
import { generateOrderFlexMessage } from "@/lib/line-flex";
import { createReceiptDownloadQuery } from "@/lib/receipt-download-token";
import { pushFlexMessageToLineUser } from "@/services/line-messaging";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const detail = await loadAdminOrderDetail(orderId);
    if (!detail) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const lineUid = detail.lineUserId?.trim();
    if (!lineUid) {
      return NextResponse.json(
        { error: "ลูกค้ายังไม่ได้เชื่อม LINE กับออเดอร์นี้ (ไม่มี line_user_id)" },
        { status: 400 }
      );
    }

    const origin = getSiteOrigin();
    const on = encodeURIComponent(detail.orderNumber);
    const q = createReceiptDownloadQuery(detail.orderNumber);
    const receiptDownloadUri =
      q.t && q.e
        ? `${origin}/api/storefront/orders/${on}/receipt?t=${encodeURIComponent(q.t)}&e=${encodeURIComponent(q.e)}`
        : `${origin}/api/storefront/orders/${on}/receipt`;

    const flex = generateOrderFlexMessage({
      orderNumber: detail.orderNumber,
      customerName: detail.customerName,
      customerPhone: detail.customerPhone,
      shippingAddress: detail.shippingAddress,
      receiptDownloadUri,
      totalAmount: detail.totalAmount,
      shippingFee: detail.shippingFee,
      discountAmount: detail.discountAmount,
      items: detail.items.map((i) => ({
        productName: i.productName,
        unitLabel: i.unitLabel,
        breederName: i.breederName,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
    });

    const result = await pushFlexMessageToLineUser(lineUid, flex);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "LINE send failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[orders/[id]/line-flex]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
