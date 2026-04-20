import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deriveProductIsActiveForCatalog } from "@/lib/validations/product";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1)
    .max(2000)
    .transform((arr) => [...new Set(arr)]),
  is_active: z.boolean(),
});

/** Smaller batches = shorter per-transaction work; avoids default 5s Prisma tx limit. */
const CHUNK = 35;

const TX_OPTS = { timeout: 20_000, maxWait: 10_000 } as const;

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { ids, is_active: requested } = parsed.data;

  try {
    // Single query: all variant rows for requested products (no per-id queries in the loop)
    const variants = await prisma.product_variants.findMany({
      where: { product_id: { in: ids.map((id) => BigInt(id)) } },
      select: { product_id: true, stock: true },
    });

    const byProduct = new Map<number, { stock?: number | null }[]>();
    for (const v of variants) {
      const pid = v.product_id != null ? Number(v.product_id) : null;
      if (pid == null) continue;
      if (!byProduct.has(pid)) byProduct.set(pid, []);
      byProduct.get(pid)!.push({ stock: v.stock });
    }

    const rows = ids.map((id) => {
      const vrows = byProduct.get(id) ?? [];
      const next = deriveProductIsActiveForCatalog(vrows, requested);
      return {
        id,
        next,
        couldNotActivate: requested === true && next === false,
      };
    });

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      await prisma.$transaction(
        chunk.map((r) =>
          prisma.products.update({
            where: { id: BigInt(r.id) },
            data: { is_active: r.next },
          })
        ),
        TX_OPTS
      );
    }

    return NextResponse.json({
      updated: rows.length,
      couldNotActivateCount: rows.filter((r) => r.couldNotActivate).length,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/products/bulk-status]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
