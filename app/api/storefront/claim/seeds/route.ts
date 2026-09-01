import { NextResponse } from "next/server";
import { z } from "zod";
import { GF_SEED_CLAIM_REQUIRED_FIELDS } from "@/lib/green-future-seed-claim";
import { saveGfSeedClaimSubmission } from "@/services/gf-seed-claim-service";

const payloadSchema = z.object({
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().default(""),
  invoicePo: z.string().min(1),
  lotNumber: z.string().min(1),
  varietyCode: z.string().min(1),
  quantity: z.string().min(1),
  receivedDate: z.string().min(1),
  openedDate: z.string().default(""),
  storageLogNotes: z.string().default(""),
  germinationMethod: z.string().min(1),
  testCount: z.string().min(1),
  timeline: z.string().default(""),
  notes: z.string().default(""),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", fields: GF_SEED_CLAIM_REQUIRED_FIELDS },
        { status: 400 }
      );
    }

    const saved = await saveGfSeedClaimSubmission(parsed.data);
    return NextResponse.json({
      ok: true,
      id: saved.id,
      message:
        "Claim received. Our team will review and forward to Green Future per the quotation terms.",
    });
  } catch (e) {
    console.error("[claim/seeds POST]", e);
    return NextResponse.json({ error: "Could not save claim" }, { status: 500 });
  }
}
