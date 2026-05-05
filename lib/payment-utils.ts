import generatePayload from "promptpay-qr";

/**
 * EMV PromptPay payload for a fixed amount (CRC checked by promptpay-qr).
 * Do not log or render the raw `promptPayId` in the storefront UI.
 */
export function buildPromptPayPayload(
  promptPayId: string,
  amountBaht: number,
): string | null {
  try {
    const id = String(promptPayId).trim();
    if (!id) return null;
    const n = Number(amountBaht);
    if (!Number.isFinite(n) || n <= 0) return null;
    return generatePayload(id, { amount: n });
  } catch {
    return null;
  }
}

/** Payee label only — never the PromptPay ID/phone. */
export const PROMPTPAY_CHECKOUT_DISPLAY_NAME = "Tommy Smile Seed" as const;
