import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { ParsedBulkRow } from "@/lib/bulk-seeds/parse-import";
import type { BulkSeedDTO } from "@/lib/bulk-seeds/types";

function asTierPrices(j: unknown): Record<string, number | null> {
  if (!j || typeof j !== "object" || Array.isArray(j)) return {};
  const out: Record<string, number | null> = {};
  for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
    if (v === null || v === undefined || v === "") {
      out[k] = null;
      continue;
    }
    const n = Number(v);
    out[k] = Number.isFinite(n) ? n : null;
  }
  return out;
}

function toDto(r: {
  id: bigint;
  source_kind: string;
  external_id: string;
  code: string;
  strain: string;
  thc: string;
  cycle: string;
  bulk_type: string;
  flavor: string;
  tier_prices: unknown;
  updated_at: Date;
}): BulkSeedDTO {
  return {
    id: String(r.id),
    source_kind: r.source_kind,
    external_id: r.external_id,
    code: r.code,
    strain: r.strain,
    thc: r.thc,
    cycle: r.cycle,
    type: r.bulk_type,
    flavor: r.flavor,
    tier_prices: asTierPrices(r.tier_prices),
    updated_at: r.updated_at.toISOString(),
  };
}

export async function listBulkSeeds(opts: {
  q?: string;
  sourceKind?: string;
  take?: number;
}): Promise<BulkSeedDTO[]> {
  const take = Math.min(Math.max(opts.take ?? 1000, 1), 2500);
  const where: Prisma.bulk_seedsWhereInput = {};
  if (opts.sourceKind?.trim()) where.source_kind = opts.sourceKind.trim();
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    where.OR = [
      { strain: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.bulk_seeds.findMany({
    where,
    orderBy: [{ source_kind: "asc" }, { strain: "asc" }, { id: "asc" }],
    take,
  });
  return rows.map(toDto);
}

export async function updateBulkSeed(
  id: bigint,
  patch: Partial<{
    code: string;
    strain: string;
    thc: string;
    cycle: string;
    type: string;
    flavor: string;
    tier_prices: Record<string, number | null>;
  }>
): Promise<BulkSeedDTO | null> {
  const data: Prisma.bulk_seedsUpdateInput = {};
  if (patch.code !== undefined) data.code = patch.code;
  if (patch.strain !== undefined) data.strain = patch.strain;
  if (patch.thc !== undefined) data.thc = patch.thc;
  if (patch.cycle !== undefined) data.cycle = patch.cycle;
  if (patch.type !== undefined) data.bulk_type = patch.type;
  if (patch.flavor !== undefined) data.flavor = patch.flavor;
  if (patch.tier_prices !== undefined) {
    data.tier_prices = patch.tier_prices as Prisma.InputJsonValue;
  }
  try {
    const r = await prisma.bulk_seeds.update({
      where: { id },
      data,
    });
    return toDto(r);
  } catch {
    return null;
  }
}

export async function deleteBulkSeed(id: bigint): Promise<boolean> {
  try {
    await prisma.bulk_seeds.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

function rowToCreateInput(
  sourceKind: string,
  r: ParsedBulkRow
): Prisma.bulk_seedsCreateManyInput {
  const external_id = r.external_id.trim().slice(0, 128);
  return {
    source_kind: sourceKind,
    external_id,
    code: r.code.slice(0, 128),
    strain: r.strain.slice(0, 512),
    thc: r.thc.slice(0, 128),
    cycle: r.cycle.slice(0, 128),
    bulk_type: r.type.slice(0, 128),
    flavor: r.flavor.slice(0, 256),
    tier_prices: r.tier_prices as Prisma.InputJsonValue,
  };
}

function dedupeRows(rows: ParsedBulkRow[]): ParsedBulkRow[] {
  const m = new Map<string, ParsedBulkRow>();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const key = r.external_id.trim().slice(0, 128) || `idx-${i}`;
    m.set(key, { ...r, external_id: key });
  }
  return [...m.values()];
}

export async function importBulkSeedsBatch(
  sourceKind: string,
  rows: ParsedBulkRow[],
  replace: boolean
): Promise<{ inserted: number }> {
  const sk = sourceKind.trim();
  if (!sk) throw new Error("sourceKind required");
  const unique = dedupeRows(rows);
  if (replace) {
    await prisma.bulk_seeds.deleteMany({ where: { source_kind: sk } });
  }
  const inputs = unique.map((r) => rowToCreateInput(sk, r));
  let inserted = 0;
  const chunk = 150;
  if (replace) {
    for (let i = 0; i < inputs.length; i += chunk) {
      const res = await prisma.bulk_seeds.createMany({
        data: inputs.slice(i, i + chunk),
      });
      inserted += res.count;
    }
    return { inserted };
  }
  for (const r of unique) {
    const data = rowToCreateInput(sk, r);
    await prisma.bulk_seeds.upsert({
      where: {
        source_kind_external_id: {
          source_kind: sk,
          external_id: data.external_id,
        },
      },
      create: data,
      update: {
        code: data.code,
        strain: data.strain,
        thc: data.thc,
        cycle: data.cycle,
        bulk_type: data.bulk_type,
        flavor: data.flavor,
        tier_prices: data.tier_prices,
      },
    });
    inserted += 1;
  }
  return { inserted };
}
