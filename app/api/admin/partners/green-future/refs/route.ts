import { requireAdminUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import {
  GREEN_FUTURE_SLUG,
  listPartnerStrainRefs,
} from "@/services/partner-catalog-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const refs = await listPartnerStrainRefs(GREEN_FUTURE_SLUG, 400);
    return NextResponse.json({ refs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
