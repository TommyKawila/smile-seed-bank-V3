import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { parseBankAccountsJsonToActive } from "@/lib/payment-settings-public";
import type { Json } from "@/types/supabase";

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

    const lineId = (row as { line_id?: string })?.line_id ?? "";
    const activeBank =
      parseBankAccountsJsonToActive((row?.bank_accounts ?? null) as Json | null)[0] ?? null;

    return NextResponse.json({
      bank: activeBank
        ? {
            name: activeBank.bank_name,
            accountNo: activeBank.account_number,
            accountName: activeBank.account_name ?? "",
          }
        : null,
      promptPay: null,
      lineId: lineId || null,
    });
  } catch (err) {
    console.error("[storefront/payment-settings]", err);
    return NextResponse.json({ bank: null, promptPay: null, lineId: null }, { status: 500 });
  }
}
