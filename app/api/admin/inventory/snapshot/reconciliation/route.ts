import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
export const dynamic = "force-dynamic";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const dateParam = searchParams.get("date");
    if (!dateParam) {
      return NextResponse.json(
        { error: "date query param required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const dateStr = dateParam.slice(0, 10);
    const startOfDay = new Date(dateStr + "T00:00:00.000Z");
    const endOfDay = new Date(dateStr + "T23:59:59.999Z");

    const prevDate = new Date(startOfDay);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const prevDateStr = toDateOnly(prevDate);

    const [prevSnapshots, soldByVariant, variants] = await Promise.all([
      prisma.stock_snapshots.findMany({
        where: { snapshot_date: new Date(prevDateStr + "T12:00:00.000Z") },
        select: { variant_id: true, quantity: true },
      }),
      prisma.order_items.groupBy({
        by: ["variant_id"],
        where: {
          variant_id: { not: null },
          orders: {
            status: { in: ["COMPLETED", "PAID", "SHIPPED"] },
            created_at: { gte: startOfDay, lte: endOfDay },
          },
        },
        _sum: { quantity: true },
      }),
      prisma.product_variants.findMany({
        where: { is_active: true },
        select: {
          id: true,
          unit_label: true,
          stock: true,
          sku: true,
          products: {
            select: { name: true, master_sku: true, breeders: { select: { name: true } } },
          },
        },
      }),
    ]);

    const startingByVariant = new Map(
      prevSnapshots.map((s) => [String(s.variant_id), s.quantity])
    );
    const soldMap = new Map(
      soldByVariant
        .filter((r) => r.variant_id != null)
        .map((r) => [String(r.variant_id!), r._sum.quantity ?? 0])
    );

    const rows = variants.map((v) => {
      const vid = String(v.id);
      const starting = startingByVariant.get(vid) ?? null;
      const sold = soldMap.get(vid) ?? 0;
      const expected = starting != null ? starting - sold : null;
      const actual = v.stock ?? 0;
      const hasDiscrepancy =
        expected != null && expected !== actual;

      return {
        variant_id: vid,
        product_name: (v.products as { name?: string })?.name ?? null,
        unit_label: v.unit_label,
        master_sku: (v.products as { master_sku?: string | null })?.master_sku ?? null,
        breeder_name: ((v.products as { breeders?: { name: string } | null })?.breeders)?.name ?? null,
        starting_stock: starting,
        units_sold: sold,
        expected_stock: expected,
        actual_stock: actual,
        has_discrepancy: hasDiscrepancy,
      };
    });

    const withActivity = rows.filter(
      (r) => r.starting_stock != null || r.units_sold > 0 || r.actual_stock > 0
    );

    return NextResponse.json(
      bigintToJson({
        date: dateStr,
        prev_date: prevDateStr,
        rows: withActivity.length > 0 ? withActivity : rows,
      })
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
