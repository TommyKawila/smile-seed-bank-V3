/**
 * Wholesale catalog + bulk pricing settings for /wholesale and /admin/wholesale.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { WholesaleCatalogStrain } from "@/lib/wholesale-public-pricing";
import { GACP_FEATURED_STRAINS } from "@/lib/gacp-featured-strains";
import { GF_PILOT_STRAIN_CODES } from "@/lib/green-future-pilot-config";
import { gfFulfillmentTier } from "@/lib/wholesale-fulfillment";
import {
  GREEN_FUTURE_SLUG,
  type PartnerStrainRecord,
} from "@/types/partner-catalog";
import { listPartnerStrains } from "@/services/partner-catalog-service";
import catalogJson from "@/data/partners/green-future/catalog.json";
import {
  DEFAULT_BULK_PRICING,
  normalizeBulkPricingConfig,
  parseBulkPricingConfig,
  type BulkPricingConfig,
} from "@/lib/wholesale-bulk-pricing";

export type WholesaleStrainDTO = {
  id: string;
  name: string;
  typeLabel: string;
  sortOrder: number;
  isActive: boolean;
};

export type WholesaleRfqListItem = {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type WholesaleSettingsDTO = {
  bulkPricing: BulkPricingConfig;
};

async function ensureSettingsRow(): Promise<void> {
  const existing = await prisma.wholesale_settings.findUnique({
    where: { id: 1 },
  });
  if (!existing) {
    await prisma.wholesale_settings.create({
      data: {
        id: 1,
        moq: 500,
        tiers: DEFAULT_BULK_PRICING as unknown as Prisma.InputJsonValue,
      },
    });
    return;
  }
  const parsed = parseBulkPricingConfig(existing.tiers);
  const raw = existing.tiers as { version?: number } | unknown[];
  const isV2 =
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw as { version?: number }).version === 2;
  if (!isV2) {
    await prisma.wholesale_settings.update({
      where: { id: 1 },
      data: {
        moq: 500,
        tiers: parsed as unknown as Prisma.InputJsonValue,
      },
    });
  }
}

export async function getBulkPricingConfig(): Promise<BulkPricingConfig> {
  await ensureSettingsRow();
  const row = await prisma.wholesale_settings.findUniqueOrThrow({
    where: { id: 1 },
  });
  return parseBulkPricingConfig(row.tiers);
}

export async function getWholesaleSettings(): Promise<WholesaleSettingsDTO> {
  return { bulkPricing: await getBulkPricingConfig() };
}

export async function updateBulkPricingConfig(
  input: BulkPricingConfig
): Promise<BulkPricingConfig> {
  await ensureSettingsRow();
  const normalized = normalizeBulkPricingConfig(input);
  await prisma.wholesale_settings.update({
    where: { id: 1 },
    data: {
      moq: 500,
      tiers: normalized as unknown as Prisma.InputJsonValue,
    },
  });
  return getBulkPricingConfig();
}

export async function listWholesaleStrains(opts?: {
  activeOnly?: boolean;
}): Promise<WholesaleStrainDTO[]> {
  const rows = await prisma.wholesale_catalog_strains.findMany({
    where: opts?.activeOnly ? { is_active: true } : undefined,
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    typeLabel: r.type_label,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  }));
}

function mapWholesaleStrain(input: {
  varietyCode: string;
  strainName: string;
  seedFormat: "AUTO_FEM" | "FEM";
  typeLabel: string | null;
}): WholesaleCatalogStrain {
  const code = input.varietyCode.trim().toUpperCase();
  const format = input.seedFormat === "FEM" ? "FEM" : "AUTO_FEM";
  const typeLabel =
    input.typeLabel?.trim() || (format === "FEM" ? "Photo" : "Auto");
  return {
    id: code,
    name: `${code} · ${input.strainName.trim()}`,
    typeLabel,
    varietyCode: code,
    seedFormat: format,
    fulfillmentTier: gfFulfillmentTier(code),
  };
}

function sortWholesaleCatalog(
  rows: WholesaleCatalogStrain[]
): WholesaleCatalogStrain[] {
  return [...rows].sort((a, b) => {
    const aReady = a.fulfillmentTier === "docs_ready" ? 0 : 1;
    const bReady = b.fulfillmentTier === "docs_ready" ? 0 : 1;
    if (aReady !== bReady) return aReady - bReady;
    const aFmt = a.seedFormat === "AUTO_FEM" ? 0 : 1;
    const bFmt = b.seedFormat === "AUTO_FEM" ? 0 : 1;
    if (aFmt !== bFmt) return aFmt - bFmt;
    return (a.varietyCode ?? a.id).localeCompare(b.varietyCode ?? b.id);
  });
}

function catalogFromJson(): WholesaleCatalogStrain[] {
  const strains = (catalogJson as { strains?: Array<Record<string, unknown>> })
    .strains;
  if (!Array.isArray(strains)) return [];
  return sortWholesaleCatalog(
    strains.flatMap((s) => {
      const stock = String(s.stockStatus ?? "").toUpperCase();
      if (stock && stock !== "IN_STOCK") return [];
      const format = String(s.seedFormat ?? "") as "AUTO_FEM" | "FEM";
      if (format !== "AUTO_FEM" && format !== "FEM") return [];
      const code = String(s.varietyCode ?? "").trim();
      const name = String(s.strainName ?? "").trim();
      if (!code || !name) return [];
      return [
        mapWholesaleStrain({
          varietyCode: code,
          strainName: name,
          seedFormat: format,
          typeLabel: typeof s.typeLabel === "string" ? s.typeLabel : null,
        }),
      ];
    })
  );
}

function catalogFromPartnerRows(
  rows: PartnerStrainRecord[]
): WholesaleCatalogStrain[] {
  return sortWholesaleCatalog(
    rows
      .filter(
        (s) =>
          s.stockStatus === "IN_STOCK" &&
          (s.seedFormat === "AUTO_FEM" || s.seedFormat === "FEM")
      )
      .map((s) =>
        mapWholesaleStrain({
          varietyCode: s.varietyCode,
          strainName: s.strainName,
          seedFormat: s.seedFormat,
          typeLabel: s.typeLabel,
        })
      )
  );
}

export function listGfPilotWholesaleCatalog(): WholesaleCatalogStrain[] {
  const byCode = new Map(
    GACP_FEATURED_STRAINS.map((s) => [s.varietyCode, s])
  );
  return GF_PILOT_STRAIN_CODES.flatMap((code) => {
    const strain = byCode.get(code);
    if (!strain) return [];
    return [
      mapWholesaleStrain({
        varietyCode: code,
        strainName: strain.displayName,
        seedFormat: strain.seedFormat,
        typeLabel: strain.typeLabel,
      }),
    ];
  });
}

function mergeWholesaleCatalog(
  primary: WholesaleCatalogStrain[],
  extra: WholesaleCatalogStrain[]
): WholesaleCatalogStrain[] {
  const map = new Map<string, WholesaleCatalogStrain>();
  for (const row of primary) map.set(row.id, row);
  for (const row of extra) {
    if (!map.has(row.id)) map.set(row.id, row);
  }
  return sortWholesaleCatalog([...map.values()]);
}

export async function listPublicWholesaleCatalog(): Promise<
  WholesaleCatalogStrain[]
> {
  const fromJson = catalogFromJson();
  try {
    const { strains } = await listPartnerStrains(GREEN_FUTURE_SLUG, {
      stockStatus: "IN_STOCK",
      limit: 500,
    });
    const fromDb = catalogFromPartnerRows(strains);
    const merged = mergeWholesaleCatalog(
      mergeWholesaleCatalog(fromJson, fromDb),
      listGfPilotWholesaleCatalog()
    );
    if (merged.length) return merged;
  } catch (err) {
    console.error("[wholesale-catalog] partner strains", err);
  }
  return mergeWholesaleCatalog(fromJson, listGfPilotWholesaleCatalog());
}

export async function createWholesaleStrain(input: {
  name: string;
  typeLabel?: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<WholesaleStrainDTO> {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  const r = await prisma.wholesale_catalog_strains.create({
    data: {
      name,
      type_label: (input.typeLabel ?? "Feminized").trim() || "Feminized",
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    },
  });
  return {
    id: String(r.id),
    name: r.name,
    typeLabel: r.type_label,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  };
}

export async function updateWholesaleStrain(
  id: string,
  input: Partial<{
    name: string;
    typeLabel: string;
    sortOrder: number;
    isActive: boolean;
  }>
): Promise<WholesaleStrainDTO | null> {
  try {
    const data: Prisma.wholesale_catalog_strainsUpdateInput = {};
    if (input.name != null) data.name = input.name.trim();
    if (input.typeLabel != null) data.type_label = input.typeLabel.trim();
    if (input.sortOrder != null) data.sort_order = Math.floor(input.sortOrder);
    if (input.isActive != null) data.is_active = input.isActive;
    const r = await prisma.wholesale_catalog_strains.update({
      where: { id: BigInt(id) },
      data,
    });
    return {
      id: String(r.id),
      name: r.name,
      typeLabel: r.type_label,
      sortOrder: r.sort_order,
      isActive: r.is_active,
    };
  } catch {
    return null;
  }
}

export async function deleteWholesaleStrain(id: string): Promise<boolean> {
  try {
    await prisma.wholesale_catalog_strains.delete({
      where: { id: BigInt(id) },
    });
    return true;
  } catch {
    return false;
  }
}

export async function listWholesaleRfqs(
  limit = 40
): Promise<WholesaleRfqListItem[]> {
  const rows = await prisma.b2b_quotes.findMany({
    where: {
      payment_notes: { contains: "Source: /wholesale public RFQ" },
    },
    orderBy: { updated_at: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  return rows.map((r) => ({
    id: String(r.id),
    quoteNumber: r.quote_number,
    clientName: r.client_name,
    clientEmail: r.client_email,
    currency: r.currency,
    totalAmount: Number(r.total_amount),
    status: r.status,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  }));
}
