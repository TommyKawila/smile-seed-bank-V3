/**
 * Storefront payment types + K-Bank display constants (no DB / server drivers).
 * Safe to import from Client Components.
 */

export const STOREFRONT_KBANK_TRANSFER_QR_IMAGE = "/payments/kbank-static-qr.png" as const;

export const STOREFRONT_KBANK_TRANSFER_ACCOUNT_NO = "5002021619" as const;
export const STOREFRONT_KBANK_TRANSFER_NAME_TH = "ธนาคารกสิกรไทย" as const;
export const STOREFRONT_KBANK_TRANSFER_NAME_EN = "Kasikornbank" as const;

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
