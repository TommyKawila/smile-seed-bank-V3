import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { Prisma } from "@prisma/client";
import { sendDailyClosingAlert } from "@/services/line-messaging";

export const dynamic = "force-dynamic";

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const dateParam = body.date as string | undefined;
    const snapshotDate = dateParam ? new Date(dateParam) : new Date();
    const dateStr = toDateOnly(snapshotDate);

    const variants = await prisma.product_variants.findMany({
      where: { is_active: true },
      select: { id: true, stock: true, price: true, cost_price: true },
    });

    const snapshotDateNorm = new Date(dateStr + "T12:00:00.000Z");
    const snapshots = variants.map((v) => ({
      snapshot_date: snapshotDateNorm,
      variant_id: v.id,
      quantity: v.stock ?? 0,
      total_value: new Prisma.Decimal(
        (v.stock ?? 0) * Number(v.cost_price ?? v.price ?? 0)
      ),
    }));

    await prisma.$transaction(
      snapshots.map((s) =>
        prisma.stock_snapshots.upsert({
          where: {
            snapshot_date_variant_id: {
              snapshot_date: s.snapshot_date,
              variant_id: s.variant_id,
            },
          },
          create: s,
          update: { quantity: s.quantity, total_value: s.total_value },
        })
      )
    );

    void (async () => {
      try {
        const startOfDay = new Date(dateStr + "T00:00:00.000Z");
        const endOfDay = new Date(dateStr + "T23:59:59.999Z");
        const agg = await prisma.orders.aggregate({
          where: {
            created_at: { gte: startOfDay, lte: endOfDay },
            OR: [
              { status: { in: ["COMPLETED", "PAID", "SHIPPED"] } },
              { status: { in: ["PENDING", "PROCESSING"] }, payment_status: "paid" },
            ],
          },
          _sum: { total_amount: true },
          _count: true,
        });
        const totalSales = Number(agg._sum?.total_amount ?? 0);
        const orderCount = agg._count ?? 0;
        const r = await sendDailyClosingAlert({ date: dateStr, totalSales, orderCount });
        if (!r.success) console.error("[inventory/snapshot] LINE daily alert:", r.error);
      } catch (e) {
        console.error("[inventory/snapshot] LINE daily alert error:", e);
      }
    })();

    return NextResponse.json(
      bigintToJson({ success: true, date: dateStr, count: snapshots.length })
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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
    const snapshotDate = new Date(dateStr + "T12:00:00.000Z");

    const snapshots = await prisma.stock_snapshots.findMany({
      where: { snapshot_date: snapshotDate },
      include: {
        product_variants: {
          select: {
            id: true,
            unit_label: true,
            sku: true,
            products: {
              select: { name: true, master_sku: true, breeders: { select: { name: true } } },
            },
          },
        },
      },
    });

    const payload = snapshots.map((s) => ({
      id: String(s.id),
      snapshot_date: toDateOnly(s.snapshot_date),
      variant_id: String(s.variant_id),
      quantity: s.quantity,
      total_value: s.total_value ? Number(s.total_value) : null,
      created_at: s.created_at?.toISOString() ?? null,
      product_name: (s.product_variants.products as { name?: string })?.name ?? null,
      unit_label: s.product_variants.unit_label,
      master_sku: (s.product_variants.products as { master_sku?: string | null })?.master_sku ?? null,
      breeder_name: ((s.product_variants.products as { breeders?: { name: string } | null })?.breeders)?.name ?? null,
    }));

    return NextResponse.json(bigintToJson(payload));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
