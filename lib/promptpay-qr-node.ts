import QRCode from "qrcode";
import { buildPromptPayPayload } from "@/lib/payment-utils";

/** CRC-checked PromptPay EMV payload → PNG data URL for email embedding. */
export async function promptPayAmountQrDataUrl(
  promptPayId: string,
  amountBaht: number
): Promise<string | null> {
  try {
    const payload = buildPromptPayPayload(promptPayId, amountBaht);
    if (!payload) return null;
    return await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}
