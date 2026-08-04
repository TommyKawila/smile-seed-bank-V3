import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getWholesaleSettings,
  updateWholesaleSettings,
} from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

const TierSchema = z.object({
  minQty: z.coerce.number().int().min(1),
  maxQty: z.union([z.coerce.number().int().min(1), z.null()]),
  thbPerSeed: z.coerce.number().min(0),
  eurPerSeed: z.coerce.number().min(0),
  bestValue: z.boolean().optional().default(false),
});

const PutSchema = z.object({
  moq: z.coerce.number().int().min(1).optional(),
  gacpFeeThb: z.coerce.number().min(0).optional(),
  gacpFeeEur: z.coerce.number().min(0).optional(),
  tiers: z.array(TierSchema).min(1).max(10).optional(),
});

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const settings = await getWholesaleSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const parsed = PutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const settings = await updateWholesaleSettings(parsed.data);
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
