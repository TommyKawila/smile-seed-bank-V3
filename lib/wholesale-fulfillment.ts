import { GF_PILOT_STRAIN_CODES } from "@/lib/green-future-pilot-config";
import type { WholesaleCatalogStrain } from "@/lib/wholesale-public-pricing";

export type FulfillmentTier = "docs_ready" | "docs_pending";

const DOCS_READY = new Set<string>(
  GF_PILOT_STRAIN_CODES.map((c) => c.toUpperCase())
);

export function gfFulfillmentTier(varietyCode: string): FulfillmentTier {
  return DOCS_READY.has(varietyCode.trim().toUpperCase())
    ? "docs_ready"
    : "docs_pending";
}

export function countDocsPendingLines(
  lines: Array<{ fulfillmentTier?: FulfillmentTier; quantity: number }>
): number {
  return lines.filter(
    (l) => l.fulfillmentTier === "docs_pending" && Math.floor(l.quantity) > 0
  ).length;
}

function csvCell(value: string): string {
  const v = value.replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}

export function wholesaleCatalogCsv(rows: WholesaleCatalogStrain[]): string {
  const header = ["code", "name", "format", "docs", "lead_time"].join(",");
  const lines = rows.map((row) => {
    const code = (row.varietyCode ?? row.id).trim();
    const format = row.seedFormat === "FEM" ? "Photo" : "Auto";
    const docs =
      row.fulfillmentTier === "docs_ready" ? "documented" : "pending_docs";
    const lead =
      row.fulfillmentTier === "docs_ready"
        ? "3_business_days"
        : "about_1_month";
    return [code, row.name, format, docs, lead].map(csvCell).join(",");
  });
  return [header, ...lines].join("\n");
}

export function wholesaleCatalogShareText(
  rows: WholesaleCatalogStrain[],
  locale: "th" | "en"
): string {
  const title =
    locale === "th"
      ? `SGF SEEDS · ${rows.length} สาย`
      : `SGF SEEDS · ${rows.length} strains`;
  const body = rows
    .map((row) => {
      const code = (row.varietyCode ?? row.id).trim();
      const format = row.seedFormat === "FEM" ? "Photo" : "Auto";
      const lead =
        row.fulfillmentTier === "docs_ready"
          ? locale === "th"
            ? "มีเอกสาร · 3 วันทำการ"
            : "documented · 3 business days"
          : locale === "th"
            ? "รอเอกสาร ~1 เดือน"
            : "awaiting docs ~1 month";
      return `${code} · ${row.name} · ${format} · ${lead}`;
    })
    .join("\n");
  return `${title}\n${body}`;
}
