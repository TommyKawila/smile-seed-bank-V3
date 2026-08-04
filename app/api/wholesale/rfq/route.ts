import { NextResponse } from "next/server";
import { z } from "zod";
import { submitWholesaleRfq } from "@/services/wholesale-rfq-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(3).max(40),
  address: z.string().trim().min(5).max(1000),
  paymentMethod: z.enum(["THB_BANK", "EUR_WIRE", "USDT"]),
  coaMode: z.enum(["none", "with"]).default("none"),
  buyExtraCoa: z.boolean().default(false),
  coaPackageA: z.number().int().min(0).max(100).default(0),
  coaPackageB: z.number().int().min(0).max(100).default(0),
  message: z.string().trim().max(2000).optional(),
  currency: z.enum(["THB", "EUR"]),
  lines: z
    .array(
      z.object({
        strainName: z.string().trim().min(1).max(120),
        quantity: z.number().int().min(1).max(1_000_000),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await submitWholesaleRfq(parsed.data);
    return NextResponse.json({
      ok: true,
      quoteNumber: result.quoteNumber,
      quoteId: result.quoteId,
      totalAmount: result.totalAmount,
    });
  } catch (err) {
    console.error("[api/wholesale/rfq]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to submit RFQ",
      },
      { status: 500 }
    );
  }
}
