import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { listGfSeedClaimSubmissions } from "@/services/gf-seed-claim-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const claims = await listGfSeedClaimSubmissions();
    return NextResponse.json({ claims });
  } catch (e) {
    console.error("[admin/claim/seeds GET]", e);
    return NextResponse.json({ error: "Could not list claims" }, { status: 500 });
  }
}
