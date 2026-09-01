import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import { getGfSeedClaimSubmission } from "@/services/gf-seed-claim-service";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const { id } = await params;
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid claim id" }, { status: 400 });
    }
    const claim = await getGfSeedClaimSubmission(parsed.data);
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    return NextResponse.json({ claim });
  } catch (e) {
    console.error("[admin/claim/seeds/[id] GET]", e);
    return NextResponse.json({ error: "Could not load claim" }, { status: 500 });
  }
}
