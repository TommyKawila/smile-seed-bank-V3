/**
 * Storefront payment types + K-Bank display constants (no DB / server drivers).
 * Safe to import from Client Components.
 *
 * Shipping for cart/checkout uses `calculateShipping` → `shippingFeeForSubtotal` in
 * `lib/order-financials.ts` (defaults below when no DB rule matches `STOREFRONT_SHIPPING_CATEGORY`).
 */
export {
  QUOTATION_SHIPPING_COST as STOREFRONT_DEFAULT_SHIPPING_COST,
  QUOTATION_SHIPPING_FREE_THRESHOLD as STOREFRONT_DEFAULT_FREE_SHIPPING_THRESHOLD,
  shippingFeeForSubtotal,
} from "@/lib/order-financials";

export const STOREFRONT_KBANK_TRANSFER_QR_IMAGE = "/payments/kbank-static-qr.png" as const;

export const STOREFRONT_KBANK_TRANSFER_ACCOUNT_NO = "5002021619" as const;
export const STOREFRONT_KBANK_TRANSFER_NAME_TH = "ธนาคารกสิกรไทย" as const;
export const STOREFRONT_KBANK_TRANSFER_NAME_EN = "Kasikornbank" as const;

/** Toggle PromptPay QR vs bank transfer-first checkout (single config for client + API). */
export const PAYMENT_CONFIG = {
  /** When false: hide PromptPay UI and return 503 from `/api/storefront/promptpay-payload`. */
  isPromptPayEnabled: true,
} as const;

/** Parsed `payment_settings.prompt_pay` for storefront (never exposes raw target id). */
export type StorefrontPromptPayPublic = {
  /** `identifier` present and not explicitly inactive in JSON. */
  isConfigured: boolean;
  /** Label next to QR / payee line (from DB `accountName` or fallback constant). */
  payeeDisplayName: string;
};

function accountDigits(s: string | null | undefined): string {
  return String(s ?? "").replace(/\D/g, "");
}

/** Avoid duplicating the primary K-Bank row from admin JSON when listing extra accounts. */
export function isPrimaryKbankCheckoutAccount(
  accountNo: string | null | undefined,
): boolean {
  return accountDigits(accountNo) === STOREFRONT_KBANK_TRANSFER_ACCOUNT_NO;
}

/** Public storefront shape for payment instructions (no API keys or admin-only fields). */
export type PaymentSetting = {
  id: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  qr_code_url: string | null;
  is_active: boolean;
  source: "bank";
};

/** One row from admin `payment_settings.bank_accounts` JSON (active / shown on storefront). */
export type ActiveBankAccount = {
  id: number;
  bank_name: string;
  account_name: string | null;
  account_number: string;
  qr_code_url: string | null;
};
