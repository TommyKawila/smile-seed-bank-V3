import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { listWholesaleDeposits } from "@/services/wholesale-deposit-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const deposits = await listWholesaleDeposits();
    return NextResponse.json({ deposits });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
