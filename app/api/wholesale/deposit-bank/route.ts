import { NextResponse } from "next/server";
import { fetchActiveBankAccounts } from "@/lib/payment-settings-public";
import {
  pickTmyAgrotradeAccount,
  toTmyBankPublic,
} from "@/lib/tmy-deposit-bank";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { accounts } = await fetchActiveBankAccounts();
  const bank = toTmyBankPublic(pickTmyAgrotradeAccount(accounts));
  return NextResponse.json({ ok: true, bank });
}
