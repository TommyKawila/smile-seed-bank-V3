import generatePayload from "promptpay-qr";
import { quantizeBaht2 } from "@/lib/money-thb";

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
    const amount = quantizeBaht2(n);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return generatePayload(id, { amount });
  } catch {
    return null;
  }
}

/** Payee label only — never the PromptPay ID/phone. */
export const PROMPTPAY_CHECKOUT_DISPLAY_NAME = "Tommy Smile Seed" as const;
