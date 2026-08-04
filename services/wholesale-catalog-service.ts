/**
 * Wholesale catalog + bulk pricing settings for /wholesale and /admin/wholesale.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { WholesaleCatalogStrain } from "@/lib/wholesale-public-pricing";
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

function slugId(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `strain-${id}`;
}

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

export async function listPublicWholesaleCatalog(): Promise<
  WholesaleCatalogStrain[]
> {
  const rows = await listWholesaleStrains({ activeOnly: true });
  return rows.map((r) => ({
    id: slugId(r.name, r.id),
    name: r.name,
    typeLabel: r.typeLabel,
  }));
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
