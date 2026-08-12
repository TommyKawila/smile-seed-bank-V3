/**
 * Partner seed catalog — Green Future B2B/GACP reference data.
 */

import { prisma } from "@/lib/prisma";
import {
  toDocumentRecord,
  toPriceListRecord,
  toStrainRecord,
  toSupplierRecord,
} from "@/lib/partner-catalog-map";
import type {
  PartnerDocumentRecord,
  PartnerIstaStatus,
  PartnerPriceListRecord,
  PartnerSeedFormat,
  PartnerStockStatus,
  PartnerStrainListResult,
  PartnerStrainRecord,
  PartnerSupplierRecord,
} from "@/types/partner-catalog";
import { GREEN_FUTURE_SLUG } from "@/types/partner-catalog";

export type ListPartnerStrainsQuery = {
  q?: string;
  seedFormat?: PartnerSeedFormat | "ALL";
  stockStatus?: PartnerStockStatus | "ALL";
  istaStatus?: PartnerIstaStatus | "ALL";
  limit?: number;
  offset?: number;
};

export async function getPartnerSupplierBySlug(
  slug: string
): Promise<PartnerSupplierRecord | null> {
  const row = await prisma.partner_suppliers.findUnique({ where: { slug } });
  return row ? toSupplierRecord(row) : null;
}

export async function listPartnerDocuments(
  supplierSlug: string
): Promise<PartnerDocumentRecord[]> {
  const supplier = await prisma.partner_suppliers.findUnique({
    where: { slug: supplierSlug },
  });
  if (!supplier) return [];
  const rows = await prisma.partner_documents.findMany({
    where: { supplier_id: supplier.id },
    orderBy: [{ doc_type: "asc" }, { id: "asc" }],
  });
  return rows.map(toDocumentRecord);
}

export async function listPartnerStrains(
  supplierSlug: string,
  query: ListPartnerStrainsQuery = {}
): Promise<PartnerStrainListResult> {
  const supplier = await prisma.partner_suppliers.findUnique({
    where: { slug: supplierSlug },
  });
  if (!supplier) return { strains: [], total: 0 };

  const q = query.q?.trim().toLowerCase() ?? "";
  const limit = Math.min(Math.max(query.limit ?? 200, 1), 500);
  const offset = Math.max(query.offset ?? 0, 0);

  const rows = await prisma.partner_strains.findMany({
    where: {
      supplier_id: supplier.id,
      is_active: true,
      ...(query.seedFormat && query.seedFormat !== "ALL"
        ? { seed_format: query.seedFormat }
        : {}),
      ...(query.stockStatus && query.stockStatus !== "ALL"
        ? { stock_status: query.stockStatus }
        : {}),
      ...(query.istaStatus && query.istaStatus !== "ALL"
        ? { ista_status: query.istaStatus }
        : {}),
    },
    orderBy: [{ seed_format: "asc" }, { sort_order: "asc" }, { variety_code: "asc" }],
  });

  const filtered = q
    ? rows.filter((row) => {
        const hay = `${row.variety_code} ${row.strain_name} ${row.type_label ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
    : rows;

  const slice = filtered.slice(offset, offset + limit);
  return {
    strains: slice.map(toStrainRecord),
    total: filtered.length,
  };
}

export async function getPartnerStrainByCode(
  supplierSlug: string,
  varietyCode: string
): Promise<PartnerStrainRecord | null> {
  const supplier = await prisma.partner_suppliers.findUnique({
    where: { slug: supplierSlug },
  });
  if (!supplier) return null;
  const row = await prisma.partner_strains.findUnique({
    where: {
      supplier_id_variety_code: {
        supplier_id: supplier.id,
        variety_code: varietyCode.trim().toUpperCase(),
      },
    },
  });
  return row ? toStrainRecord(row) : null;
}

export async function listPartnerStrainRefs(
  supplierSlug: string,
  limit = 300
): Promise<string[]> {
  const { strains } = await listPartnerStrains(supplierSlug, { limit });
  return strains.map((s) => `${s.varietyCode} (${s.strainName.toUpperCase()})`);
}

export async function getActivePartnerPriceList(
  supplierSlug: string
): Promise<PartnerPriceListRecord | null> {
  const supplier = await prisma.partner_suppliers.findUnique({
    where: { slug: supplierSlug },
  });
  if (!supplier) return null;

  const row = await prisma.partner_price_lists.findFirst({
    where: { supplier_id: supplier.id, status: "ACTIVE" },
    include: {
      tiers: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
      coa_services: { orderBy: [{ sort_order: "asc" }, { id: "asc" }] },
    },
    orderBy: { id: "desc" },
  });

  return row ? toPriceListRecord(row) : null;
}

export { GREEN_FUTURE_SLUG };
