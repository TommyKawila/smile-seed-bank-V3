import { NextRequest, NextResponse } from "next/server";
import { createOrderLog } from "@/lib/order-logs";
import { revalidateAfterOrderStatusChange } from "@/lib/revalidate-storefront-order";
import { revertApprovalToPending } from "@/services/orders-service";

export const dynamic = "force-dynamic";

function isMobileAdminUi(req: NextRequest): boolean {
  return req.headers.get("x-admin-ui") === "m";
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const { error } = await revertApprovalToPending(orderId);
    if (error) {
      const lower = error.toLowerCase();
      if (lower.includes("not found")) {
        return NextResponse.json({ error }, { status: 404 });
      }
      if (lower.includes("only paid")) {
        return NextResponse.json({ error }, { status: 400 });
      }
      return NextResponse.json({ error }, { status: 500 });
    }

    if (isMobileAdminUi(_req)) {
      await createOrderLog({
        orderId,
        action: "MOBILE_DASH",
        messageContent: "Mobile Quick: approval reverted to pending / awaiting verification",
      });
    }

    await revalidateAfterOrderStatusChange(orderId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id]/revert-approval", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
