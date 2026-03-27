import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get("count") === "true";

    const variants = await prisma.product_variants.findMany({
      where: { is_active: true },
      include: {
        products: {
          select: {
            name: true,
            master_sku: true,
            breeders: { select: { name: true } },
          },
        },
      },
    });

    const low = variants.filter((v) => {
      const th = v.low_stock_threshold ?? 5;
      return (v.stock ?? 0) <= th;
    });

    if (countOnly) {
      return NextResponse.json(bigintToJson({ count: low.length }));
    }

    const items = low.map((v) => ({
      variantId: Number(v.id),
      product_name: v.products?.name ?? "—",
      unit_label: v.unit_label,
      breeder: v.products?.breeders?.name ?? "—",
      stock: v.stock ?? 0,
      low_stock_threshold: v.low_stock_threshold ?? 5,
      master_sku: v.products?.master_sku ?? "—",
      sku: v.sku ?? "—",
    }));

    return NextResponse.json(bigintToJson(items));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
