import { NextResponse } from "next/server";
import { gfAcceptsPublicDeposits } from "@/lib/green-future-approved-marketing";
import { getDepositOrderPublic } from "@/services/wholesale-deposit-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!gfAcceptsPublicDeposits()) {
    return NextResponse.json(
      { error: "Customer deposits are not open" },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref")?.trim() ?? "";
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }
  const order = await getDepositOrderPublic(ref);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, order });
}
