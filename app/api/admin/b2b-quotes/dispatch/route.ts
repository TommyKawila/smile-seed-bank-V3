import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { sendB2BQuoteEmail } from "@/services/b2b-quote-service";

export const dynamic = "force-dynamic";

const LineSchema = z.object({
  id: z.string().optional(),
  strainName: z.string().min(1).max(200),
  breederName: z.string().max(80).optional().default(""),
  quantity: z.number().int().min(0).max(10_000_000),
  unitPrice: z.number().min(0).max(1_000_000),
  lineTotal: z.number().min(0).optional(),
});

const BodySchema = z.object({
  quoteId: z.string().optional().nullable(),
  quoteNumber: z.string().max(48).optional().nullable(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email(),
  shippingAddress: z.string().max(500).optional().default(""),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.enum(["EUR", "THB"]),
  items: z.array(LineSchema).min(1).max(100),
  discountAmount: z.number().min(0).max(1_000_000_000),
  shippingFee: z.number().min(0).max(1_000_000_000),
  paymentNotes: z.string().max(5000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const items = parsed.data.items.map((it, i) => ({
      id: it.id ?? `tmp-${i}`,
      strainName: it.strainName,
      breederName: it.breederName ?? "",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal ?? it.quantity * it.unitPrice,
    }));
    const result = await sendB2BQuoteEmail({ ...parsed.data, items });
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      quoteId: result.quoteId ?? null,
      quoteNumber: result.quoteNumber ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
