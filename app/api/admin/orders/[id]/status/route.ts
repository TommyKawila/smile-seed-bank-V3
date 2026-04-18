import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bigintToJson } from "@/lib/bigint-json";
import { revalidateAfterOrderStatusChange } from "@/lib/revalidate-storefront-order";
import { approvePayment, rejectPayment, markShipped } from "@/services/orders-service";

const StatusSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), note: z.string().optional() }),
  z.object({
    action: z.literal("ship"),
    trackingNumber: z.string().min(3, "กรุณาระบุเลขพัสดุ"),
    shippingProvider: z.string().min(1, "กรุณาเลือกผู้ให้บริการขนส่ง"),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (Number.isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    if (action === "approve") {
      const { data, error } = await approvePayment(orderId);
      if (error) return NextResponse.json({ error }, { status: 500 });
      await revalidateAfterOrderStatusChange(orderId);
      return NextResponse.json({
        success: true,
        status: "PAID",
        order: data ? bigintToJson(data.order) : undefined,
      });
    }

    if (action === "reject") {
      const note = (parsed.data.note ?? "").trim() || "Payment rejected";
      const { error } = await rejectPayment(orderId, note);
      if (error) return NextResponse.json({ error }, { status: 500 });
      await revalidateAfterOrderStatusChange(orderId);
      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    if (action === "ship") {
      const { trackingNumber, shippingProvider } = parsed.data;
      const { data, error } = await markShipped(orderId, trackingNumber.trim(), shippingProvider);
      if (error) return NextResponse.json({ error }, { status: 500 });
      await revalidateAfterOrderStatusChange(orderId);
      return NextResponse.json({
        success: true,
        status: "SHIPPED",
        quotationStatusSynced: data?.quotationSynced ?? false,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id]/status error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
