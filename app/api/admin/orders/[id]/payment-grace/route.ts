import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import {
  clearOrderPaymentGrace,
  extendOrderPaymentGrace,
  PAYMENT_GRACE_HOUR_OPTIONS,
} from "@/services/orders-service";

export const dynamic = "force-dynamic";

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("extend"),
    hours: z.coerce
      .number()
      .int()
      .refine((h) => PAYMENT_GRACE_HOUR_OPTIONS.includes(h as (typeof PAYMENT_GRACE_HOUR_OPTIONS)[number]), {
        message: `hours must be one of: ${PAYMENT_GRACE_HOUR_OPTIONS.join(", ")}`,
      }),
    note: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("clear"),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertAdmin();

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

    if (parsed.data.action === "clear") {
      const { error } = await clearOrderPaymentGrace(orderId);
      if (error) {
        const lower = error.toLowerCase();
        const status = lower.includes("not found")
          ? 404
          : lower.includes("no active") || lower.includes("payment grace:")
            ? 400
            : 500;
        return NextResponse.json({ error }, { status });
      }
      return NextResponse.json({ success: true, paymentGraceUntil: null });
    }

    const { hours, note } = parsed.data;
    const { data, error } = await extendOrderPaymentGrace(orderId, hours, note);
    if (error) {
      const lower = error.toLowerCase();
      const status =
        lower.includes("not found") ? 404 : lower.includes("payment grace:") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }
    return NextResponse.json({
      success: true,
      paymentGraceUntil: data?.payment_grace_until ?? null,
    });
  } catch (err) {
    console.error("PATCH /api/admin/orders/[id]/payment-grace", err);
    const message = err instanceof Error ? err.message : String(err);
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
