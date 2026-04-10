import crypto from "crypto";

/** LINE Messaging API: `X-Line-Signature` = Base64(HMAC-SHA256(channel secret, raw body)). */
export function verifyLineChannelWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET?.trim();
  if (!secret || !signature?.trim()) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const sig = signature.trim();
  if (expected.length !== sig.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(sig, "utf8"));
  } catch {
    return false;
  }
}
