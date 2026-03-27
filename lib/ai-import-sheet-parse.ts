/**
 * CSV / Google Sheet row parsing for AI Import (Thai headers, multi-pack columns).
 */

import { cleanStrainName } from "@/lib/product-utils";
import { toBreederPrefix, toProductPart } from "@/lib/sku-utils";

export function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Strip noise from strain name for SKU and cleaner display (uses {@link cleanStrainName}). */
export function cleanStrainNameForSku(raw: string): string {
  return cleanStrainName(raw);
}

export function parseStockValue(raw: string): number {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s || s === "-" || s === "—" || s === "n/a") return 0;
  if (s === "หมด" || s.includes("out of stock") || s === "oos") return 0;
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function parsePriceValue(raw: string): number {
  const s = String(raw ?? "").trim();
  if (!s || s === "-" || s === "—") return 0;
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Strip percentage noise from genetic/type column (e.g. "Mostly Indica 65%" → "Mostly Indica"). */
export function cleanGeneticType(raw: string): string {
  return raw.replace(/\s*\d+%/g, "").replace(/\s+/g, " ").trim();
}

function getCell(obj: Record<string, unknown>, key: string | undefined): string {
  if (!key) return "";
  const v = obj[key];
  if (v == null) return "";
  return String(v).trim();
}

function pickField(record: Record<string, unknown>, aliases: string[]): string {
  for (const key of Object.keys(record)) {
    const nk = normalizeHeader(key);
    for (const a of aliases) {
      if (nk === a || nk.includes(a)) {
        const v = record[key];
        if (v == null) return "";
        return String(v).trim();
      }
    }
  }
  return "";
}

function getPackColumnKeySet(packMap: PackColumnMap): Set<string> {
  const s = new Set<string>();
  for (const [, col] of packMap) {
    if (col.stockKey) s.add(col.stockKey);
    if (col.priceKey) s.add(col.priceKey);
  }
  return s;
}

/** Legacy single price/stock — never match Pack N / จำนวน Pack N columns (avoids false hasValues). */
function pickLegacyField(
  record: Record<string, unknown>,
  aliases: string[],
  packKeys: Set<string>
): string {
  for (const key of Object.keys(record)) {
    if (packKeys.has(key)) continue;
    const nk = normalizeHeader(key);
    if (/pack\s*\d+/.test(nk)) continue;
    for (const a of aliases) {
      if (nk === a || nk.includes(a)) {
        const v = record[key];
        if (v == null) return "";
        return String(v).trim();
      }
    }
  }
  return "";
}

/** Map pack size -> original CSV column keys */
export type PackColumnMap = Map<number, { stockKey?: string; priceKey?: string }>;

/** Standard sheet packs → manual grid variants (1 Seed … 5 Seeds). */
export const IMPORT_PACK_SIZES = [1, 2, 3, 5] as const;

function matchPackStockColumn(n: string): RegExpMatchArray | null {
  return (
    n.match(/(?:จำนวน|qty|quantity|stock|amount)\s*(?:pack|แพ็ค|แพค)\s*(\d+)/i) ||
    n.match(/(?:pack|แพ็ค|แพค)\s*(\d+)\s*(?:qty|quantity|stock|จำนวน|amount)/i) ||
    n.match(/(?:จำนวน|qty|quantity|stock)\s*pack\s*(\d+)/i) ||
    n.match(/pack\s*(\d+)\s*(?:qty|quantity|stock|จำนวน)/i)
  );
}

function matchPackPriceColumn(n: string): RegExpMatchArray | null {
  return (
    n.match(/(?:pack|แพ็ค|แพค)\s*(\d+)\s*(?:price|ราคา)/i) ||
    n.match(/(?:price|ราคา)\s*(?:pack|แพ็ค|แพค)\s*(\d+)/i) ||
    n.match(/pack\s*(\d+)\s*price/i) ||
    n.match(/ราคา\s*pack\s*(\d+)/i) ||
    n.match(/price\s*pack\s*(\d+)/i)
  );
}

export function discoverPackColumns(headerKeys: string[]): PackColumnMap {
  const m: PackColumnMap = new Map();
  for (const key of headerKeys) {
    const n = normalizeHeader(key);
    let mm = matchPackStockColumn(n);
    if (mm) {
      const sz = parseInt(mm[1]!, 10);
      if (sz >= 1 && sz <= 99) {
        if (!m.has(sz)) m.set(sz, {});
        m.get(sz)!.stockKey = key;
      }
    }
    mm = matchPackPriceColumn(n);
    if (mm) {
      const sz = parseInt(mm[1]!, 10);
      if (sz >= 1 && sz <= 99) {
        if (!m.has(sz)) m.set(sz, {});
        m.get(sz)!.priceKey = key;
      }
    }
  }
  return m;
}

const STANDARD_PACK_SET = new Set<number>(IMPORT_PACK_SIZES);

type PackCell = { stock: number; price: number };

function coercePackRecord(
  raw: Record<string | number, PackCell> | undefined
): Record<number, PackCell> {
  const out: Record<number, PackCell> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw)) {
    const pk = Number(k);
    if (!Number.isFinite(pk) || !v || typeof v !== "object") continue;
    out[pk] = {
      stock: Number((v as PackCell).stock) || 0,
      price: Number((v as PackCell).price) || 0,
    };
  }
  return out;
}

/** Ensure 1/2/3/5 keys exist for preview + handoff (missing columns → 0). Accepts JSON string keys. */
export function normalizeByPackForImport(
  raw: Record<number, PackCell> | Record<string, PackCell> | undefined
): Record<number, PackCell> {
  const coerced = coercePackRecord(raw as Record<string | number, PackCell>);
  const out: Record<number, PackCell> = {};
  for (const sz of IMPORT_PACK_SIZES) {
    const v = coerced[sz];
    out[sz] = v ? { stock: v.stock, price: v.price } : { stock: 0, price: 0 };
  }
  for (const [k, v] of Object.entries(coerced)) {
    const pk = Number(k);
    if (!Number.isFinite(pk) || STANDARD_PACK_SET.has(pk)) continue;
    out[pk] = { stock: v.stock, price: v.price };
  }
  return out;
}

/** Single-cell preview: `10 / ฿850` (หมด → 0 via parseStockValue upstream). */
export function formatPackQtyPriceCell(
  byPack: Record<number, PackCell> | undefined,
  packSize: number
): string {
  const loose = byPack as Record<string | number, PackCell> | undefined;
  const bp = loose?.[packSize] ?? loose?.[String(packSize)];
  if (!bp) return "—";
  const { stock, price } = bp;
  if (stock === 0 && price === 0) return "—";
  const p = Number.isInteger(price)
    ? price.toLocaleString("th-TH")
    : price.toLocaleString("th-TH", { maximumFractionDigits: 2 });
  return `${stock} / ฿${p}`;
}

/** Any non-empty stock/price cell (including "หมด") or legacy single columns */
function rowHasPackOrLegacyValues(
  obj: Record<string, unknown>,
  packMap: PackColumnMap,
  legacyPriceRaw: string,
  legacyStockRaw: string
): boolean {
  for (const [, col] of packMap) {
    if (getCell(obj, col.stockKey).trim()) return true;
    if (getCell(obj, col.priceKey).trim()) return true;
  }
  if (legacyPriceRaw.trim()) return true;
  if (legacyStockRaw.trim()) return true;
  return false;
}

function geneticTypeToSkuSuffix(geneticType: string): string {
  const u = geneticType.trim().toUpperCase();
  if (!u) return "UNK";
  if (u.includes("AUTO")) return "AUTO";
  if (u.includes("PHOTO") || u.includes("PHOTOPERIOD")) return "PHOTO";
  if (u.includes("FEM") || u === "FF") return "FF";
  const p = toProductPart(geneticType).replace(/-/g, "");
  return p.slice(0, 10) || "TYPE";
}

export function buildImportMasterSku(
  breederName: string,
  cleanedStrainName: string,
  geneticType: string
): string {
  const prefix = toBreederPrefix(breederName);
  const namePart = toProductPart(cleanStrainNameForSku(cleanedStrainName));
  const typePart = geneticTypeToSkuSuffix(geneticType);
  return `${prefix}-${namePart}-${typePart}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export type ParsedImportSheetRow = {
  id: string;
  rowKind: "product" | "category" | "skipped";
  name: string;
  displayName: string;
  breeder: string;
  url: string;
  geneticType: string;
  /** Sheet section from last section header row (Photoperiod / Auto / …). */
  section: string;
  masterSku: string;
  price: number;
  stock: number;
  byPack: Record<number, { stock: number; price: number }>;
  status: "idle" | "queued" | "running" | "done" | "error" | "skipped";
  errorMessage?: string;
};

const NAME_ALIASES = [
  "strains name",
  "strain name",
  "name",
  "strain",
  "product",
  "ชื่อ",
  "สายพันธุ์",
];
const BREEDER_ALIASES = ["breeder", "brand", "แบรนด์", "breeder name"];
const URL_ALIASES = ["url", "link", "product url", "ลิงก์"];
const TYPE_ALIASES = ["type", "genetic_type", "genetic type", "ประเภท", "ชนิด"];
const PRICE_ALIASES = ["price", "ราคา"];
const STOCK_ALIASES = ["stock", "qty", "quantity", "สต็อก", "จำนวน"];

/** Row labels that are section headers, not products (Strains Name column). */
const SECTION_HEADER_NAME_RE =
  /^(photoperiod|photo|autoflow(?:ering)?|auto|feminized|fem|regular|fast\s*version)$/i;

/** Repeated CSV header row (do not import as product). */
const REPEATED_HEADER_NAME_RE =
  /^(strains?\s*name|strain\s*name|type|breeder|brand|แบรนด์|url|link|ราคา|price|stock|จำนวน|pack\s*\d+)$/i;

export function parseSheetRowsToImportRows(
  data: Record<string, unknown>[]
): ParsedImportSheetRow[] {
  const headerKeys = data.length > 0 ? Object.keys(data[0] ?? {}) : [];
  const packMap = discoverPackColumns(headerKeys);
  const packColumnKeys = getPackColumnKeySet(packMap);
  const out: ParsedImportSheetRow[] = [];
  let activeSection = "";
  let i = 0;

  for (const obj of data) {
    const id = `row-${i++}`;
    const nameRaw = pickField(obj, NAME_ALIASES);
    const breeder = pickField(obj, BREEDER_ALIASES);
    const url = pickField(obj, URL_ALIASES);
    const geneticType = cleanGeneticType(pickField(obj, TYPE_ALIASES));
    let legacyPriceRaw = pickLegacyField(obj, PRICE_ALIASES, packColumnKeys);
    let legacyStockRaw = pickLegacyField(obj, STOCK_ALIASES, packColumnKeys);

    const byPackRaw: Record<number, { stock: number; price: number }> = {};
    for (const [sz, col] of packMap) {
      const st = parseStockValue(getCell(obj, col.stockKey));
      const pr = parsePriceValue(getCell(obj, col.priceKey));
      byPackRaw[sz] = { stock: st, price: pr };
    }

    const hasPackCols = packMap.size > 0;
    const hasValues = rowHasPackOrLegacyValues(
      obj,
      packMap,
      legacyPriceRaw,
      legacyStockRaw
    );
    const displayName = cleanStrainNameForSku(nameRaw) || nameRaw.trim();

    if (!nameRaw.trim() && !url.trim()) {
      out.push({
        id,
        rowKind: "skipped",
        name: "",
        displayName: "",
        breeder: "",
        url: "",
        geneticType: "",
        section: activeSection,
        masterSku: "",
        price: 0,
        stock: 0,
        byPack: {},
        status: "skipped",
        errorMessage: "Empty row",
      });
      continue;
    }

    if (
      nameRaw.trim() &&
      REPEATED_HEADER_NAME_RE.test(nameRaw.trim()) &&
      !hasValues &&
      !/^https?:\/\//i.test(url.trim())
    ) {
      out.push({
        id,
        rowKind: "skipped",
        name: nameRaw.trim(),
        displayName: nameRaw.trim(),
        breeder: "",
        url: "",
        geneticType: "",
        section: activeSection,
        masterSku: "",
        price: 0,
        stock: 0,
        byPack: {},
        status: "skipped",
        errorMessage: "Header row",
      });
      continue;
    }

    if (
      nameRaw.trim() &&
      !hasValues &&
      !/^https?:\/\//i.test(url.trim()) &&
      SECTION_HEADER_NAME_RE.test(nameRaw.trim())
    ) {
      activeSection = nameRaw.trim();
      out.push({
        id,
        rowKind: "category",
        name: activeSection,
        displayName: activeSection,
        breeder: "",
        url: "",
        geneticType: "",
        section: activeSection,
        masterSku: "",
        price: 0,
        stock: 0,
        byPack: {},
        status: "skipped",
      });
      continue;
    }

    const priceLegacy = parsePriceValue(legacyPriceRaw);
    const stockLegacy = parseStockValue(legacyStockRaw);
    let price = priceLegacy;
    let stock = stockLegacy;
    const byPack = normalizeByPackForImport(byPackRaw);

    if (hasPackCols && Object.keys(byPackRaw).length) {
      const sizes = Object.keys(byPackRaw)
        .map(Number)
        .sort((a, b) => a - b);
      const first = sizes[0];
      if (first != null && byPackRaw[first]) {
        price = byPackRaw[first].price || price;
        stock = byPackRaw[first].stock || stock;
      }
    }

    const masterSku = breeder.trim()
      ? buildImportMasterSku(breeder, nameRaw, geneticType || "Hybrid")
      : "";

    out.push({
      id,
      rowKind: "product",
      name: nameRaw.trim(),
      displayName,
      breeder: breeder.trim(),
      url: url.trim(),
      geneticType: geneticType.trim(),
      section: activeSection,
      masterSku,
      price,
      stock,
      byPack,
      status: "idle",
    });
  }

  return out;
}
