import { NextResponse } from "next/server";
import { gfAcceptsPublicDeposits } from "@/lib/green-future-approved-marketing";
import { fetchActiveBankAccounts } from "@/lib/payment-settings-public";
import {
  pickTmyAgrotradeAccount,
  toTmyBankPublic,
} from "@/lib/tmy-deposit-bank";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!gfAcceptsPublicDeposits()) {
    return NextResponse.json(
      { error: "Customer deposits are not open" },
      { status: 403 }
    );
  }
  const { accounts } = await fetchActiveBankAccounts();
  const bank = toTmyBankPublic(pickTmyAgrotradeAccount(accounts));
  return NextResponse.json({ ok: true, bank });
}
