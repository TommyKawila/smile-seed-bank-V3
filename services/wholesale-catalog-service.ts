/**
 * Wholesale catalog + settings for /wholesale and /admin/wholesale.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  WholesaleCatalogStrain,
  WholesaleTier,
} from "@/lib/wholesale-public-pricing";
import {
  DEFAULT_WHOLESALE_TIERS,
  GACP_FEE_EUR,
  GACP_FEE_THB,
  WHOLESALE_PUBLIC_MOQ,
} from "@/lib/wholesale-public-pricing";

export type WholesaleSettingsDTO = {
  moq: number;
  gacpFeeThb: number;
  gacpFeeEur: number;
  tiers: WholesaleTier[];
};

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

function slugId(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `strain-${id}`;
}

function parseTiers(raw: unknown): WholesaleTier[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_WHOLESALE_TIERS;
  const out: WholesaleTier[] = [];
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i] as Record<string, unknown>;
    const minQty = Number(t.minQty);
    const thbPerSeed = Number(t.thbPerSeed);
    const eurPerSeed = Number(t.eurPerSeed);
    if (!Number.isFinite(minQty) || !Number.isFinite(thbPerSeed) || !Number.isFinite(eurPerSeed)) {
      continue;
    }
    const maxRaw = t.maxQty;
    const maxQty =
      maxRaw == null || maxRaw === ""
        ? null
        : Number.isFinite(Number(maxRaw))
          ? Number(maxRaw)
          : null;
    out.push({
      id: (i + 1) as WholesaleTier["id"],
      minQty: Math.floor(minQty),
      maxQty,
      thbPerSeed,
      eurPerSeed,
      bestValue: Boolean(t.bestValue),
    });
  }
  return out.length ? out : DEFAULT_WHOLESALE_TIERS;
}

async function ensureSettingsRow(): Promise<void> {
  const existing = await prisma.wholesale_settings.findUnique({ where: { id: 1 } });
  if (existing) return;
  await prisma.wholesale_settings.create({
    data: {
      id: 1,
      moq: WHOLESALE_PUBLIC_MOQ,
      gacp_fee_thb: new Prisma.Decimal(GACP_FEE_THB),
      gacp_fee_eur: new Prisma.Decimal(GACP_FEE_EUR),
      tiers: DEFAULT_WHOLESALE_TIERS.map(({ id: _id, ...rest }) => rest) as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function getWholesaleSettings(): Promise<WholesaleSettingsDTO> {
  await ensureSettingsRow();
  const row = await prisma.wholesale_settings.findUniqueOrThrow({ where: { id: 1 } });
  return {
    moq: row.moq,
    gacpFeeThb: Number(row.gacp_fee_thb),
    gacpFeeEur: Number(row.gacp_fee_eur),
    tiers: parseTiers(row.tiers),
  };
}

export async function updateWholesaleSettings(input: {
  moq?: number;
  gacpFeeThb?: number;
  gacpFeeEur?: number;
  tiers?: Omit<WholesaleTier, "id">[];
}): Promise<WholesaleSettingsDTO> {
  await ensureSettingsRow();
  const data: Prisma.wholesale_settingsUpdateInput = {};
  if (input.moq != null) data.moq = Math.max(1, Math.floor(input.moq));
  if (input.gacpFeeThb != null) {
    data.gacp_fee_thb = new Prisma.Decimal(input.gacpFeeThb);
  }
  if (input.gacpFeeEur != null) {
    data.gacp_fee_eur = new Prisma.Decimal(input.gacpFeeEur);
  }
  if (input.tiers) {
    data.tiers = input.tiers as unknown as Prisma.InputJsonValue;
  }
  await prisma.wholesale_settings.update({ where: { id: 1 }, data });
  return getWholesaleSettings();
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

export async function listPublicWholesaleCatalog(): Promise<WholesaleCatalogStrain[]> {
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
    await prisma.wholesale_catalog_strains.delete({ where: { id: BigInt(id) } });
    return true;
  } catch {
    return false;
  }
}

export async function listWholesaleRfqs(limit = 40): Promise<WholesaleRfqListItem[]> {
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
