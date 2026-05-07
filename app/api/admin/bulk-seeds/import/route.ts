import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { importBulkSeedsBatch } from "@/services/bulk-seeds-service";

const TierPricesSchema = z.record(z.string(), z.union([z.number(), z.null()]).optional());

const RowSchema = z.object({
  external_id: z.string(),
  code: z.string().optional().default(""),
  strain: z.string().optional().default(""),
  thc: z.string().optional().default(""),
  cycle: z.string().optional().default(""),
  type: z.string().optional().default(""),
  flavor: z.string().optional().default(""),
  tier_prices: TierPricesSchema.optional().default({}),
});

const BodySchema = z.object({
  sourceKind: z.string().min(1).max(32),
  replace: z.boolean().optional().default(false),
  rows: z.array(RowSchema).max(5000),
});

export async function POST(req: Request) {
  try {
    await assertAdmin();
    const json: unknown = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const { sourceKind, replace, rows } = parsed.data;
    const normalized = rows.map((r) => ({
      external_id: r.external_id,
      code: r.code,
      strain: r.strain,
      thc: r.thc,
      cycle: r.cycle,
      type: r.type,
      flavor: r.flavor,
      tier_prices: Object.fromEntries(
        Object.entries(r.tier_prices ?? {}).map(([k, v]) => [k, v ?? null])
      ),
    }));
    const { inserted } = await importBulkSeedsBatch(sourceKind, normalized, replace);
    return NextResponse.json({ ok: true, inserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
