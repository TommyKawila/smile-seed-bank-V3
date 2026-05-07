import type { BulkSeedDTO } from "@/lib/bulk-seeds/types";

function coerceTierPrices(v: unknown): Record<string, number | null> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, number | null> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (val === null || val === undefined || val === "") {
      out[k] = null;
      continue;
    }
    const n = Number(val);
    out[k] = Number.isFinite(n) ? n : null;
  }
  return out;
}

/** Coerce API / optimistic partials into a stable row; drop invalid entries. */
export function coerceBulkSeedRow(v: unknown): BulkSeedDTO | null {
  if (v == null || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const id = o.id != null ? String(o.id).trim() : "";
  if (!id) return null;
  return {
    id,
    source_kind: o.source_kind != null ? String(o.source_kind) : "",
    external_id: o.external_id != null ? String(o.external_id) : "",
    code: o.code != null ? String(o.code) : "",
    strain: o.strain != null ? String(o.strain) : "",
    thc: o.thc != null ? String(o.thc) : "",
    cycle: o.cycle != null ? String(o.cycle) : "",
    type: o.type != null ? String(o.type) : "",
    flavor: o.flavor != null ? String(o.flavor) : "",
    tier_prices: coerceTierPrices(o.tier_prices),
    updated_at:
      o.updated_at != null && String(o.updated_at).trim() !== ""
        ? String(o.updated_at)
        : new Date(0).toISOString(),
  };
}

export function sanitizeBulkSeedList(list: unknown): BulkSeedDTO[] {
  if (!Array.isArray(list)) return [];
  const out: BulkSeedDTO[] = [];
  for (const item of list) {
    const row = coerceBulkSeedRow(item);
    if (row) out.push(row);
  }
  return out;
}
