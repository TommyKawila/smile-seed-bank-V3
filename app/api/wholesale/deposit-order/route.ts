import { NextResponse } from "next/server";
import { z } from "zod";
import { gfAcceptsPublicDeposits } from "@/lib/green-future-approved-marketing";
import { createWholesaleDepositOrder } from "@/services/wholesale-deposit-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(3).max(40),
  address: z.string().trim().min(5).max(1000),
  coaMode: z.enum(["none", "with"]).default("none"),
  buyExtraCoa: z.boolean().default(false),
  coaPackageA: z.number().int().min(0).max(100).default(0),
  coaPackageB: z.number().int().min(0).max(100).default(0),
  licenseStatus: z.enum(["active", "pending"]).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
  lines: z
    .array(
      z.object({
        varietyCode: z.string().trim().min(1).max(32),
        strainName: z.string().trim().min(1).max(200),
        quantity: z.number().int().min(1).max(1_000_000),
      })
    )
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  if (!gfAcceptsPublicDeposits()) {
    return NextResponse.json(
      { error: "Customer deposits are not open" },
      { status: 403 }
    );
  }

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
    const result = await createWholesaleDepositOrder(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[api/wholesale/deposit-order]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create reservation",
      },
      { status: 500 }
    );
  }
}
