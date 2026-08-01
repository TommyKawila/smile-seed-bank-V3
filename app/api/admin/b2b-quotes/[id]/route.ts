import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { deleteB2BQuote, getB2BQuote, saveB2BQuote } from "@/services/b2b-quote-service";

export const dynamic = "force-dynamic";

const LineSchema = z.object({
  id: z.string().optional(),
  strainName: z.string().min(1).max(200),
  quantity: z.number().int().min(0).max(10_000_000),
  unitPrice: z.number().min(0).max(1_000_000),
  lineTotal: z.number().min(0).optional(),
});

const SaveSchema = z.object({
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().max(320).optional().default(""),
  shippingAddress: z.string().max(500).optional().default(""),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.enum(["EUR", "THB"]),
  items: z.array(LineSchema).min(1).max(100),
  discountAmount: z.number().min(0).max(1_000_000_000),
  shippingFee: z.number().min(0).max(1_000_000_000),
  paymentNotes: z.string().max(5000).nullable().optional(),
  status: z.enum(["DRAFT", "SENT"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await assertAdmin();
    const { id } = await ctx.params;
    const quote = await getB2BQuote(id);
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ quote });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await assertAdmin();
    const { id } = await ctx.params;
    const existing = await getB2BQuote(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const raw = await req.json().catch(() => ({}));
    const parsed = SaveSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const items = parsed.data.items.map((it, i) => ({
      id: it.id ?? `tmp-${i}`,
      strainName: it.strainName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal ?? it.quantity * it.unitPrice,
    }));
    const quote = await saveB2BQuote({
      id,
      ...parsed.data,
      items,
      status: parsed.data.status ?? existing.status,
    });
    return NextResponse.json({ quote });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await assertAdmin();
    const { id } = await ctx.params;
    await deleteB2BQuote(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
