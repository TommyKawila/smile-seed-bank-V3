import { BULK_SEED_DEFAULT_TIER_KEYS } from "@/lib/bulk-seeds/constants";

export type ParsedBulkRow = {
  external_id: string;
  code: string;
  strain: string;
  thc: string;
  cycle: string;
  type: string;
  flavor: string;
  tier_prices: Record<string, number | null>;
};

function normHeader(h: string): string {
  return h.replace(/^\ufeff/, "").trim().toLowerCase().replace(/\s+/g, " ");
}

function tierKeyFromHeader(raw: string): string | undefined {
  const h = raw.replace(/^\ufeff/, "").trim().replace(/\s+/g, "").toUpperCase();
  if (!h) return undefined;
  if (/^1M\+$/i.test(h) || /^1000000\+$/i.test(h)) return "1000000_plus";
  if (/^\d{1,9}$/.test(h)) return h.replace(/^0+/, "") || "0";
  if (/^\d+[K]$/.test(h)) {
    const n = Number(h.slice(0, -1)) * 1000;
    if (n === 1_000_000) return "1000000_plus";
    return String(n);
  }
  return undefined;
}

function aliasField(norm: string): keyof Omit<ParsedBulkRow, "tier_prices"> | undefined {
  if (norm === "id" || norm === "#" || norm === "no" || norm === "no.") return "external_id";
  if (norm === "code" || norm === "sku") return "code";
  if (norm === "strain" || norm === "name" || norm === "variety" || norm === "cultivar") return "strain";
  if (norm === "thc") return "thc";
  if (norm === "cycle") return "cycle";
  if (norm === "type" || norm === "seed type" || norm === "flower type") return "type";
  if (norm === "flavor" || norm === "flavour" || norm === "terpene") return "flavor";
  return undefined;
}

export function parsePriceCell(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[,฿\s]/g, "").replace(/[^\d.-]/g, "");
  if (s === "" || s === "-") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function emptyRow(): Omit<ParsedBulkRow, "tier_prices"> & { tier_prices: Record<string, number | null> } {
  return {
    external_id: "",
    code: "",
    strain: "",
    thc: "",
    cycle: "",
    type: "",
    flavor: "",
    tier_prices: {},
  };
}

function stableFallbackId(r: Omit<ParsedBulkRow, "tier_prices">, idx: number): string {
  const base = `${r.code}|${r.strain}|${idx}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) | 0;
  return `gen-${Math.abs(h).toString(36)}`;
}

/** Map header row (display strings) to column roles. */
export function buildColumnMap(headers: string[]): {
  fieldByIndex: (keyof Omit<ParsedBulkRow, "tier_prices"> | "tier" | "skip")[];
  tierKeyByIndex: (string | undefined)[];
} {
  const fieldByIndex: (keyof Omit<ParsedBulkRow, "tier_prices"> | "tier" | "skip")[] = [];
  const tierKeyByIndex: (string | undefined)[] = [];
  for (const h of headers) {
    const n = normHeader(h);
    const field = aliasField(n);
    if (field) {
      fieldByIndex.push(field);
      tierKeyByIndex.push(undefined);
      continue;
    }
    const tier = tierKeyFromHeader(h);
    if (tier) {
      fieldByIndex.push("tier");
      tierKeyByIndex.push(tier);
      continue;
    }
    fieldByIndex.push("skip");
    tierKeyByIndex.push(undefined);
  }
  return { fieldByIndex, tierKeyByIndex };
}

export function matrixToParsedRows(headerRow: string[], dataRows: string[][]): ParsedBulkRow[] {
  const { fieldByIndex, tierKeyByIndex } = buildColumnMap(headerRow);
  const out: ParsedBulkRow[] = [];
  let idx = 0;
  for (const cells of dataRows) {
    if (cells.every((c) => String(c ?? "").trim() === "")) continue;
    const r = emptyRow();
    for (let c = 0; c < fieldByIndex.length; c++) {
      const val = cells[c] ?? "";
      const role = fieldByIndex[c];
      if (role === "skip") continue;
      if (role === "tier") {
        const tk = tierKeyByIndex[c];
        if (tk) r.tier_prices[tk] = parsePriceCell(val);
        continue;
      }
      const s = String(val).trim();
      switch (role) {
        case "external_id":
          r.external_id = s;
          break;
        case "code":
          r.code = s;
          break;
        case "strain":
          r.strain = s;
          break;
        case "thc":
          r.thc = s;
          break;
        case "cycle":
          r.cycle = s;
          break;
        case "type":
          r.type = s;
          break;
        case "flavor":
          r.flavor = s;
          break;
        default:
          break;
      }
    }
    if (!r.strain && !r.code) {
      idx++;
      continue;
    }
    if (!r.external_id.trim()) r.external_id = stableFallbackId(r, idx);
    idx++;
    out.push(r);
  }
  return out;
}

/** PapaParse result: array of objects with string values. */
export function recordsToParsedRows(records: Record<string, unknown>[]): ParsedBulkRow[] {
  if (records.length === 0) return [];
  const headers = Object.keys(records[0] ?? {});
  const matrix: string[][] = records.map((row) =>
    headers.map((h) => String(row[h] ?? ""))
  );
  return matrixToParsedRows(headers, matrix);
}

export function defaultTierKeysForExport(fromRows: Record<string, number | null>[]): string[] {
  const defaults = BULK_SEED_DEFAULT_TIER_KEYS as unknown as string[];
  const set = new Set<string>([...defaults]);
  for (const tp of fromRows) {
    for (const k of Object.keys(tp)) {
      if (tp[k] != null && tp[k] !== undefined) set.add(k);
    }
  }
  const order = [...defaults];
  const rest = [...set].filter((k) => !order.includes(k));
  rest.sort((a, b) => {
    if (a === "1000000_plus") return 1;
    if (b === "1000000_plus") return -1;
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });
  return [...order.filter((k) => set.has(k)), ...rest];
}
