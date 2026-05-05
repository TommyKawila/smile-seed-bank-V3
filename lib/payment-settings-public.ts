import "server-only";

import { getSql } from "@/lib/db";
import type { Json } from "@/types/supabase";
import type { PaymentSetting } from "@/lib/storefront-payment-shared";

type BankJson = {
  bankName?: string;
  accountName?: string;
  accountNo?: string;
  isActive?: boolean;
  bank_name?: string;
  account_name?: string;
  account_no?: string;
  is_active?: boolean;
};

function parseBankAccounts(raw: Json | null): BankJson[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as BankJson[];
}

function bankRowExplicitInactive(b: BankJson): boolean {
  return b.isActive === false || b.is_active === false;
}

function normalizedBankFields(b: BankJson): {
  bankName: string;
  accountNo: string;
  accountName: string;
} | null {
  const bankName = (b.bankName ?? b.bank_name ?? "").trim();
  const accountNo = (b.accountNo ?? b.account_no ?? "").trim();
  const accountName = (b.accountName ?? b.account_name ?? "").trim();
  if (!bankName || !accountNo) return null;
  return { bankName, accountNo, accountName };
}

/**
 * Loads bank accounts + LINE OA id for storefront payment UIs via server Postgres (guest-safe).
 */
export async function fetchCheckoutPaymentSettings(): Promise<{
  settings: PaymentSetting[];
  error: boolean;
  lineId: string | null;
}> {
  try {
    const rows = await getSql()`
      SELECT bank_accounts, line_id
      FROM payment_settings
      WHERE id = 1
      LIMIT 1
    `;
    const row = rows[0] as
      | { bank_accounts: Json | null; line_id?: string | null }
      | undefined;

    const lineId = row?.line_id?.trim() ? row.line_id.trim() : null;

    if (!row) {
      return {
        settings: [],
        error: false,
        lineId,
      };
    }

    const settings: PaymentSetting[] = [];
    let idCounter = 0;

    const banksParsed = parseBankAccounts(row.bank_accounts);
    for (const b of banksParsed) {
      if (bankRowExplicitInactive(b)) continue;
      const line = normalizedBankFields(b);
      if (!line) continue;
      idCounter += 1;
      settings.push({
        id: idCounter,
        bank_name: line.bankName,
        account_number: line.accountNo,
        account_name: line.accountName || null,
        qr_code_url: null,
        is_active: true,
        source: "bank",
      });
    }

    if (settings.length === 0) {
      console.warn(
        "[fetchCheckoutPaymentSettings] No bank rows after filter — bank_accounts length:",
        banksParsed.length,
      );
    }

    return { settings, error: false, lineId };
  } catch (e) {
    console.error("[fetchCheckoutPaymentSettings]", e);
    return {
      settings: [],
      error: true,
      lineId: null,
    };
  }
}
