import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const variants = await prisma.product_variants.findMany({
      where: { is_active: true, products: { is_active: true } },
      include: {
        products: {
          select: {
            id: true,
            breeder_id: true,
            category_id: true,
            product_categories: { select: { name: true } },
            breeders: { select: { name: true } },
          },
        },
      },
    });

    let totalInventoryValue = 0;
    let totalItemsInStock = 0;
    const breederValueMap = new Map<string, { name: string; value: number }>();
    const categoryStockMap = new Map<string, number>();
    const productTotalStock = new Map<number, number>();

    for (const v of variants) {
      const stock = Number(v.stock ?? 0);
      const costPrice = Number(v.cost_price ?? 0);
      const value = stock * costPrice;
      totalInventoryValue += value;
      totalItemsInStock += stock;

      const pid = v.product_id ? Number(v.product_id) : 0;
      productTotalStock.set(pid, (productTotalStock.get(pid) ?? 0) + stock);

      const breederId = v.products?.breeder_id != null ? String(v.products.breeder_id) : "_none";
      const breederName = v.products?.breeders?.name ?? "Unknown";
      if (!breederValueMap.has(breederId)) {
        breederValueMap.set(breederId, { name: breederName, value: 0 });
      }
      breederValueMap.get(breederId)!.value += value;

      const catName = v.products?.product_categories?.name ?? "Uncategorized";
      categoryStockMap.set(catName, (categoryStockMap.get(catName) ?? 0) + stock);
    }

    // Total Varieties: only products that have at least one active variant
    const totalVarieties = productTotalStock.size;

    // Out of Stock: products that HAVE variants AND total stock across all variants is 0
    const outOfStockProductIds: number[] = [];
    for (const [pid, total] of productTotalStock) {
      if (total === 0) outOfStockProductIds.push(pid);
    }
    const outOfStockCount = outOfStockProductIds.length;

    if (outOfStockCount > 0) {
      const outOfStockProducts = await prisma.products.findMany({
        where: { id: { in: outOfStockProductIds.map((id) => BigInt(id)) } },
        select: { name: true },
      });
    }

    const valueByBreeder = Array.from(breederValueMap.entries())
      .filter(([k]) => k !== "_none")
      .map(([id, { name, value }]) => ({ breederId: id, name, value }))
      .sort((a, b) => b.value - a.value);

    const stockByCategory = Array.from(categoryStockMap.entries()).map(([name, stock]) => ({
      name,
      stock,
    }));

    const lowStockItems = await prisma.product_variants.findMany({
      where: {
        is_active: true,
        stock: { gt: 0, lt: 5 },
        products: { is_active: true },
      },
      include: {
        products: {
          select: {
            name: true,
            master_sku: true,
            breeders: { select: { name: true } },
          },
        },
      },
      orderBy: { stock: "asc" },
      take: 20,
    });

    const lowStock = lowStockItems.map((v) => ({
      variantId: Number(v.id),
      productName: v.products?.name ?? "—",
      masterSku: v.products?.master_sku ?? "",
      breederName: v.products?.breeders?.name ?? "",
      unitLabel: v.unit_label,
      stock: Number(v.stock ?? 0),
      sku: v.sku,
    }));

    return NextResponse.json(
      bigintToJson({
        totalInventoryValue,
        totalVarieties,
        totalItemsInStock,
        outOfStockCount,
        valueByBreeder,
        stockByCategory,
        lowStock,
      })
    );
  } catch (err) {
    console.error("[inventory/stats]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
