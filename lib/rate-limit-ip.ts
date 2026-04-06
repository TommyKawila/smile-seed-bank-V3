/**
 * Simple in-memory rate limiter (per Node process). For multi-instance production,
 * prefer Redis/Upstash; this still reduces abuse on single-instance deploys.
 */
const buckets = new Map<string, number[]>();

export function rateLimitIp(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  let arr = buckets.get(key) ?? [];
  arr = arr.filter((t) => t > windowStart);
  if (arr.length >= limit) {
    const oldest = arr[0] ?? now;
    const retryAfterMs = windowMs - (now - oldest);
    return { ok: false, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true };
}
