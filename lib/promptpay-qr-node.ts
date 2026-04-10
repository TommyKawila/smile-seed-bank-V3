import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

/** CRC-checked PromptPay EMV payload → PNG data URL for email embedding. */
export async function promptPayAmountQrDataUrl(
  promptPayId: string,
  amountBaht: number
): Promise<string | null> {
  try {
    const id = String(promptPayId).trim();
    if (!id) return null;
    const n = Number(amountBaht);
    if (!Number.isFinite(n) || n <= 0) return null;
    const payload = generatePayload(id, { amount: n });
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
