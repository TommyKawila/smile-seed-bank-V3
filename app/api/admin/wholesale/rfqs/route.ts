import { requireAdminUser } from "@/lib/auth-utils";
import { NextResponse } from "next/server";
import { listWholesaleRfqs } from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const rfqs = await listWholesaleRfqs();
    return NextResponse.json({ rfqs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
