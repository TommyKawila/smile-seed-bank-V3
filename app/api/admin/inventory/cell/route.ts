import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toVariantSku } from "@/lib/sku-utils";

export const dynamic = "force-dynamic";

function packToLabel(pack: number): string {
  return pack === 1 ? "1 Seed" : `${pack} Seeds`;
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, productId, pack, masterSku, stock, cost_price, price, low_stock_threshold } = body as {
      variantId?: number | null;
      productId?: number;
      pack?: number;
      masterSku?: string;
      stock?: number;
      cost_price?: number;
      price?: number;
      low_stock_threshold?: number;
    };

    const updates: { stock?: number; cost_price?: number; price?: number; low_stock_threshold?: number } = {};
    if (typeof stock === "number") updates.stock = Math.max(0, Math.round(stock));
    if (typeof cost_price === "number") updates.cost_price = Math.max(0, cost_price);
    if (typeof price === "number") updates.price = price;
    if (typeof low_stock_threshold === "number" && low_stock_threshold >= 0)
      updates.low_stock_threshold = Math.round(low_stock_threshold);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "stock, cost_price, price, or low_stock_threshold required" }, { status: 400 });
    }

    let vid: bigint;
    if (variantId) {
      await prisma.product_variants.update({
        where: { id: BigInt(variantId) },
        data: updates,
      });
      const v = await prisma.product_variants.findUnique({
        where: { id: BigInt(variantId) },
        select: { product_id: true },
      });
      if (!v) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
      vid = v.product_id!;
    } else if (productId && pack && masterSku) {
      const label = packToLabel(pack);
      const sku = toVariantSku(masterSku, label);
      const created = await prisma.product_variants.create({
        data: {
          product_id: BigInt(productId),
          unit_label: label,
          price: updates.price ?? 0,
          stock: updates.stock ?? 0,
          cost_price: updates.cost_price ?? 0,
          sku,
          is_active: true,
        },
        select: { product_id: true },
      });
      vid = created.product_id!;
    } else {
      return NextResponse.json({ error: "variantId or (productId, pack, masterSku) required" }, { status: 400 });
    }

    const variants = await prisma.product_variants.findMany({
      where: { product_id: vid, is_active: true },
      select: { price: true, stock: true },
    });
    const totalStock = variants.reduce((s, x) => s + Number(x.stock ?? 0), 0);
    const minPrice = Math.min(...variants.map((x) => Number(x.price)).filter((n) => n > 0), Infinity) || 0;

    await prisma.products.update({
      where: { id: vid },
      data: { stock: totalStock, price: minPrice || undefined },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
