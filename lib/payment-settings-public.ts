import "server-only";

import { getSql } from "@/lib/db";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PROMPTPAY_CHECKOUT_DISPLAY_NAME } from "@/lib/payment-utils";
import type { Json } from "@/types/supabase";
import type {
  ActiveBankAccount,
  PaymentSetting,
  StorefrontPromptPayPublic,
} from "@/lib/storefront-payment-shared";

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

/** Maps `payment_settings.bank_accounts` JSON (admin) to active rows only. */
export function parseBankAccountsJsonToActive(raw: Json | null): ActiveBankAccount[] {
  const out: ActiveBankAccount[] = [];
  let idCounter = 0;
  const banksParsed = parseBankAccounts(raw);
  for (const b of banksParsed) {
    if (bankRowExplicitInactive(b)) continue;
    const line = normalizedBankFields(b);
    if (!line) continue;
    idCounter += 1;
    out.push({
      id: idCounter,
      bank_name: line.bankName,
      account_name: line.accountName || null,
      account_number: line.accountNo,
      qr_code_url: null,
    });
  }
  if (out.length === 0 && banksParsed.length > 0) {
    console.warn(
      "[parseBankAccountsJsonToActive] No active rows after filter — raw items:",
      banksParsed.length,
    );
  }
  return out;
}

export function parseStorefrontPromptPayPublic(raw: Json | null): StorefrontPromptPayPublic {
  const fallbackName = PROMPTPAY_CHECKOUT_DISPLAY_NAME;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { isConfigured: false, payeeDisplayName: fallbackName };
  }
  const pp = raw as Record<string, unknown>;
  const inactive = pp.isActive === false || pp.is_active === false;
  const id = String(pp.identifier ?? "").trim();
  const nameCandidates = [pp.accountName, pp.account_name, pp.displayName, pp.payee_name];
  let payee = "";
  for (const x of nameCandidates) {
    if (typeof x === "string" && x.trim()) {
      payee = x.trim();
      break;
    }
  }
  return {
    isConfigured: !inactive && id.length > 0,
    payeeDisplayName: payee.length > 0 ? payee : fallbackName,
  };
}

/**
 * Active bank accounts from Supabase (`payment_settings.bank_accounts` JSONB).
 * Service-role client; storefront-safe (no PII beyond public transfer instructions).
 */
export async function fetchActiveBankAccounts(): Promise<{
  accounts: ActiveBankAccount[];
  lineId: string | null;
  error: boolean;
  promptPay: StorefrontPromptPayPublic;
}> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("payment_settings")
      .select("bank_accounts, line_id, prompt_pay")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    const accounts = parseBankAccountsJsonToActive(data?.bank_accounts ?? null);
    const lineId = data?.line_id?.trim() ? String(data.line_id).trim() : null;
    const promptPay = parseStorefrontPromptPayPublic(data?.prompt_pay ?? null);

    return { accounts, lineId, error: false, promptPay };
  } catch (e) {
    console.error("[fetchActiveBankAccounts]", e);
    return {
      accounts: [],
      lineId: null,
      error: true,
      promptPay: parseStorefrontPromptPayPublic(null),
    };
  }
}

/** Same projection as `fetchActiveBankAccounts().promptPay` — use when you only need PromptPay metadata. */
export async function fetchActivePromptPay(): Promise<StorefrontPromptPayPublic> {
  const { promptPay } = await fetchActiveBankAccounts();
  return promptPay;
}

function activeToPaymentSettings(accounts: ActiveBankAccount[]): PaymentSetting[] {
  return accounts.map((a) => ({
    id: a.id,
    bank_name: a.bank_name,
    account_number: a.account_number,
    account_name: a.account_name,
    qr_code_url: a.qr_code_url,
    is_active: true,
    source: "bank",
  }));
}

/**
 * Loads bank accounts + LINE OA id via Postgres (same data as `fetchActiveBankAccounts`; for callers not using Supabase client).
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

    const accounts = parseBankAccountsJsonToActive(row.bank_accounts);
    const settings = activeToPaymentSettings(accounts);

    if (settings.length === 0) {
      console.warn(
        "[fetchCheckoutPaymentSettings] No bank rows after filter — bank_accounts length:",
        parseBankAccounts(row.bank_accounts).length,
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
