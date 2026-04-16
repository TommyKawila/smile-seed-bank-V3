import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cancelPendingOrder } from "@/services/orders-service";
import { revalidateAfterOrderStatusChange } from "@/lib/revalidate-storefront-order";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  note: z.string().max(2000).optional(),
});

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

    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const { error } = await cancelPendingOrder(orderId, parsed.data.note);
    if (error) {
      const lower = error.toLowerCase();
      const status =
        lower.includes("only pending") || lower.includes("already cancelled")
          ? 400
          : lower.includes("not found")
            ? 404
            : 500;
      return NextResponse.json({ error }, { status });
    }

    await revalidateAfterOrderStatusChange(orderId);
    return NextResponse.json({ success: true, status: "CANCELLED" });
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id]/cancel", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
