import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

/**
 * Strict PostgREST select for checkout — never use "*".
 * Excludes messenger_url, updated_at, and legacy jsonb not used by storefront.
 */
export const CHECKOUT_PAYMENT_SETTINGS_SELECT =
  "id, bank_accounts, prompt_pay" as const;

/** Public storefront shape for payment instructions (no API keys or admin-only fields). */
export type PaymentSetting = {
  id: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  qr_code_url: string | null;
  is_active: boolean;
  source: "bank" | "promptpay";
};

type BankJson = {
  bankName?: string;
  accountName?: string;
  accountNo?: string;
  isActive?: boolean;
};

type PromptJson = {
  identifier?: string;
  qrUrl?: string;
  isActive?: boolean;
};

function parseBankAccounts(raw: Json | null): BankJson[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as BankJson[];
}

function parsePromptPay(raw: Json | null): PromptJson | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as PromptJson;
}

/**
 * Loads active payment display rows for checkout via Supabase (RLS-safe columns only).
 * Maps JSON columns to PaymentSetting — DB uses bank_accounts / prompt_pay, not flat columns.
 */
export async function fetchCheckoutPaymentSettings(): Promise<{
  settings: PaymentSetting[];
  error: boolean;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_settings")
      .select(CHECKOUT_PAYMENT_SETTINGS_SELECT)
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("[fetchCheckoutPaymentSettings]", error.message);
      return {
        settings: [],
        error: true,
      };
    }

    if (!data) {
      return {
        settings: [],
        error: false,
      };
    }

    const settings: PaymentSetting[] = [];
    let idCounter = 0;

    for (const b of parseBankAccounts(data.bank_accounts)) {
      if (!b?.isActive) continue;
      idCounter += 1;
      settings.push({
        id: idCounter,
        bank_name: b.bankName ?? null,
        account_number: b.accountNo ?? null,
        account_name: b.accountName ?? null,
        qr_code_url: null,
        is_active: true,
        source: "bank",
      });
    }

    const pp = parsePromptPay(data.prompt_pay);
    if (pp?.isActive && (pp.identifier || pp.qrUrl)) {
      idCounter += 1;
      settings.push({
        id: idCounter,
        bank_name: null,
        account_number: pp.identifier ?? null,
        account_name: null,
        qr_code_url: pp.qrUrl ?? null,
        is_active: true,
        source: "promptpay",
      });
    }

    return { settings, error: false };
  } catch (e) {
    console.error("[fetchCheckoutPaymentSettings]", e);
    return {
      settings: [],
      error: true,
    };
  }
}
