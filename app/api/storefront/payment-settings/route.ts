import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const revalidate = 0; // always fresh

export async function GET() {
  /** Direct SQL — public read; PromptPay omitted on storefront for privacy (static QR in checkout UI). */
  const sql = getSql();
  try {
    const rows = await sql`
      SELECT bank_accounts, line_id
      FROM payment_settings
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0] ?? null;

    type BankRow = { bankName: string; accountName: string; accountNo: string; isActive: boolean };

    const allBanks = (row?.bank_accounts ?? []) as BankRow[];
    const lineId = (row as { line_id?: string })?.line_id ?? "";

    const activeBank =
      allBanks.find(
        (b) => b.isActive !== false && b.bankName && b.accountNo,
      ) ?? null;

    return NextResponse.json({
      bank: activeBank
        ? { name: activeBank.bankName, accountNo: activeBank.accountNo, accountName: activeBank.accountName }
        : null,
      promptPay: null,
      lineId: lineId || null,
    });
  } catch (err) {
    console.error("[storefront/payment-settings]", err);
    return NextResponse.json({ bank: null, promptPay: null, lineId: null }, { status: 500 });
  }
}
