/**
 * Recursively converts BigInt values to strings in objects/arrays.
 * Prevents JSON.stringify from throwing and UI crashes when rendering API responses.
 */
export function bigintToJson<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return String(obj) as unknown as T;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown> & { toFixed?: (n?: number) => string; toString: () => string; constructor?: { name?: string } };
    if (("d" in o && "e" in o && "s" in o) || (typeof o.toFixed === "function" && o.constructor?.name?.includes("Decimal"))) {
      return o.toString() as unknown as T;
    }
  }
  if (Array.isArray(obj)) return obj.map(bigintToJson) as unknown as T;
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = bigintToJson(v);
    }
    return out as unknown as T;
  }
  return obj;
}
