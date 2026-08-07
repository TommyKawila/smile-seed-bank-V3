/**
 * OAuth `state` for LINE Login claim flow — carries order id + HMAC proof
 * so callback can re-verify ownership without trusting orderId alone.
 */

export type LineClaimOAuthState = {
  orderId: string;
  t: string;
  e: string;
};

export function encodeLineClaimOAuthState(parts: LineClaimOAuthState): string {
  // orderId and e are numeric; t is hex — use ":" separators (not in hex).
  return `${parts.orderId}:${parts.e}:${parts.t}`;
}

export function decodeLineClaimOAuthState(raw: string): LineClaimOAuthState | null {
  const s = raw.trim();
  if (!s) return null;

  // Legacy: bare order id (reject — no claim proof).
  if (/^\d+$/.test(s)) return null;

  const m = s.match(/^(\d+):(\d+):([a-f0-9]+)$/i);
  if (!m) return null;
  return { orderId: m[1]!, e: m[2]!, t: m[3]! };
}
