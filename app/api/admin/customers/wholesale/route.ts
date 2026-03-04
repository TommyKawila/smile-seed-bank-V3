import { NextRequest, NextResponse } from "next/server";
import { setWholesaleStatus } from "@/services/wholesale-service";
import { z } from "zod";

const schema = z.object({
  customerId: z.string().uuid(),
  isWholesale: z.boolean(),
  discountPercent: z.number().min(0).max(99),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { customerId, isWholesale, discountPercent } = parsed.data;
    const result = await setWholesaleStatus(customerId, isWholesale, discountPercent);

    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
