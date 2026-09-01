import { NextResponse } from "next/server";
import { buildGfClaimForwardSummary } from "@/lib/gf-seed-claim-form";
import { gfSeedClaimPayloadSchema } from "@/lib/gf-seed-claim-zod";
import { saveGfSeedClaimSubmission } from "@/services/gf-seed-claim-service";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = gfSeedClaimPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const saved = await saveGfSeedClaimSubmission(parsed.data);
    return NextResponse.json({
      ok: true,
      id: saved.id,
      forwardSummary: buildGfClaimForwardSummary(parsed.data),
      message:
        "Claim received. Our team will review and forward to Green Future per the quotation terms.",
    });
  } catch (e) {
    console.error("[claim/seeds POST]", e);
    return NextResponse.json({ error: "Could not save claim" }, { status: 500 });
  }
}
