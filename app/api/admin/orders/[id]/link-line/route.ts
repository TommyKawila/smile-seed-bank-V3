import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  lineUserId: z
    .string()
    .trim()
    .min(10, "ระบุ LINE user id")
    .max(64)
    .regex(/^U[a-fA-F0-9]{32}$/, "รูปแบบ LINE user id ไม่ถูกต้อง (U + 32 ตัว hex)"),
});

export const dynamic = "force-dynamic";

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

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const uid = parsed.data.lineUserId.trim();
    await prisma.orders.update({
      where: { id: BigInt(orderId) },
      data: { line_user_id: uid },
    });

    return NextResponse.json({ ok: true, lineUserId: uid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders/[id]/link-line]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
