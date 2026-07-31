import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePackFromUnitLabel, toVariantSku } from "@/lib/sku-utils";
import { pickKeeperVariantId } from "@/lib/product-variants-dedupe";

export const dynamic = "force-dynamic";

function packToLabel(pack: number): string {
  return pack === 1 ? "1 Seed" : `${pack} Seeds`;
}

async function removeDuplicatePackVariants(
  productId: bigint,
  pack: number,
  keeperId: bigint
): Promise<void> {
  const all = await prisma.product_variants.findMany({
    where: { product_id: productId },
    select: {
      id: true,
      unit_label: true,
      stock: true,
      price: true,
      cost_price: true,
      sku: true,
      is_active: true,
    },
  });
  const dups = all.filter(
    (v) =>
      v.id !== keeperId && parsePackFromUnitLabel(v.unit_label) === pack
  );
  for (const d of dups) {
    // Clear SKU first so unique constraint never blocks delete/update of keeper.
    if (d.sku) {
      await prisma.product_variants.update({
        where: { id: d.id },
        data: { sku: null, is_active: false },
      });
    }
    try {
      await prisma.product_variants.delete({ where: { id: d.id } });
    } catch {
      await prisma.product_variants.update({
        where: { id: d.id },
        data: { is_active: false, sku: null, stock: 0 },
      });
    }
  }
}

export async function PATCH(req: NextRequest) {
  const __adminGate = await requireAdminUser();
  if (!__adminGate.ok) return __adminGate.response;
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

    const updates: {
      stock?: number;
      cost_price?: number;
      price?: number;
      low_stock_threshold?: number;
      is_active?: boolean;
      sku?: string;
      unit_label?: string;
    } = {};
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
        select: { product_id: true, unit_label: true },
      });
      if (!v?.product_id) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
      vid = v.product_id;
      const packSize = parsePackFromUnitLabel(v.unit_label);
      await removeDuplicatePackVariants(vid, packSize, BigInt(variantId));
    } else if (productId && pack && masterSku) {
      const label = packToLabel(pack);
      const sku = toVariantSku(masterSku, label);
      const pid = BigInt(productId);

      const candidates = await prisma.product_variants.findMany({
        where: { product_id: pid },
        select: {
          id: true,
          unit_label: true,
          stock: true,
          price: true,
          cost_price: true,
          sku: true,
          is_active: true,
        },
      });
      const samePack = candidates.filter(
        (v) => parsePackFromUnitLabel(v.unit_label) === pack
      );

      if (samePack.length > 0) {
        const keeperId = pickKeeperVariantId(samePack);
        const mergedStock =
          updates.stock != null
            ? updates.stock
            : samePack.reduce((s, x) => s + Math.max(0, Number(x.stock ?? 0)), 0);

        await removeDuplicatePackVariants(pid, pack, keeperId);
        await prisma.product_variants.update({
          where: { id: keeperId },
          data: {
            unit_label: label,
            is_active: true,
            sku,
            stock: mergedStock,
            ...(updates.cost_price != null ? { cost_price: updates.cost_price } : {}),
            ...(updates.price != null ? { price: updates.price } : {}),
            ...(updates.low_stock_threshold != null
              ? { low_stock_threshold: updates.low_stock_threshold }
              : {}),
          },
        });
      } else {
        await prisma.product_variants.create({
          data: {
            product_id: pid,
            unit_label: label,
            price: updates.price ?? 0,
            stock: updates.stock ?? 0,
            cost_price: updates.cost_price ?? 0,
            sku,
            is_active: true,
            ...(updates.low_stock_threshold != null
              ? { low_stock_threshold: updates.low_stock_threshold }
              : {}),
          },
        });
      }
      vid = pid;
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
