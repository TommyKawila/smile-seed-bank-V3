import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const revalidate = 0; // always fresh

export async function GET() {
  const sql = getSql();
  try {
    // Explicit columns only — no SELECT * (excludes updated_at, crypto_wallets, messenger_url, etc.)
    const rows = await sql`
      SELECT bank_accounts, prompt_pay, line_id
      FROM payment_settings
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0] ?? null;

    type BankRow = { bankName: string; accountName: string; accountNo: string; isActive: boolean };
    type PromptPayRow = { identifier: string; qrUrl: string; isActive: boolean };

    const allBanks = (row?.bank_accounts ?? []) as BankRow[];
    const promptPay = (row?.prompt_pay ?? null) as PromptPayRow | null;
    const lineId = (row as { line_id?: string })?.line_id ?? "";

    const activeBank = allBanks.find((b) => b.isActive) ?? null;

    return NextResponse.json({
      bank: activeBank
        ? { name: activeBank.bankName, accountNo: activeBank.accountNo, accountName: activeBank.accountName }
        : null,
      promptPay:
        promptPay?.isActive
          ? { identifier: promptPay.identifier, qrUrl: promptPay.qrUrl ?? "" }
          : null,
      lineId: lineId || null,
    });
  } catch (err) {
    console.error("[storefront/payment-settings]", err);
    return NextResponse.json({ bank: null, promptPay: null, lineId: null }, { status: 500 });
  }
}
