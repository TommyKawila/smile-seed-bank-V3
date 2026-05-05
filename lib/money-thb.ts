/**
 * THB money helpers: integer satang comparisons and 2-decimal quantization (PromptPay / checkout).
 */

/** Convert BAHT → integer satang (`220.00` → `22000`). Same `Number.EPSILON` guard across Node/V8 versions (localhost + Vercel). */
export function bahtToSatangInt(baht: number): number {
  const x = Number(baht);
  if (!Number.isFinite(x)) return NaN;
  const scaled = x * 100;
  const sign = scaled >= 0 ? 1 : -1;
  const ROUND_GUARD = Number.EPSILON;
  const mag = Math.abs(scaled) + ROUND_GUARD;
  return sign * Math.round(mag);
}

export function satangIntToBaht(satang: number): number {
  if (!Number.isFinite(satang)) return NaN;
  return satang / 100;
}

/** Normalize to 2 decimal THB for persistence / EMV amount field. */
export function quantizeBaht2(baht: number): number {
  return satangIntToBaht(bahtToSatangInt(baht));
}

export function sameBahtSatang(a: number, b: number): boolean {
  return bahtToSatangInt(a) === bahtToSatangInt(b);
}
