import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { toVariantSku, parsePackFromUnitLabel } from "@/lib/sku-utils";
import { FLOWERING_DB_PHOTO_3N } from "@/lib/constants";

export const dynamic = "force-dynamic";

function packToLabel(pack: number): string {
  return pack === 1 ? "1 Seed" : `${pack} Seeds`;
}

function isNumericCategoryId(v: unknown): boolean {
  if (v == null || v === "") return false;
  return /^\d+$/.test(String(v).trim());
}

function normalizeFloweringType(v: unknown): typeof FLOWERING_DB_PHOTO_3N | null {
  if (v == null || v === "") return null;
  const s = String(v).trim().toLowerCase().replace(/-/g, "_");
  return s === FLOWERING_DB_PHOTO_3N ? FLOWERING_DB_PHOTO_3N : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { masterSku, breederId, name, category, categoryId, strain_dominance, byPack, packSizes, flowering_type } =
    body as {
      masterSku: string;
      breederId: number;
      name: string;
      category?: string;
      categoryId?: string | number;
      strain_dominance?: "Mostly Indica" | "Mostly Sativa" | "Hybrid 50/50" | null;
      byPack: Record<number, { stock: number; price: number }>;
      /** Active pack columns from Manual Grid (for row shape) */
      packSizes?: number[];
      flowering_type?: string | null;
    };

  if (!masterSku?.trim()) {
    return NextResponse.json({ error: "masterSku required" }, { status: 400 });
  }

  const bid = BigInt(breederId);

  try {
    let product = await prisma.products.findFirst({
    where: { master_sku: masterSku.trim() },
    include: { product_variants: true },
  });
  const wasCreated = !product;

  const cid = isNumericCategoryId(categoryId) ? BigInt(String(categoryId)) : null;
  const masterSkuTrim = masterSku.trim();
  const hasFloweringKey = Object.prototype.hasOwnProperty.call(body, "flowering_type");
  const ftNorm = normalizeFloweringType(flowering_type);

  if (!product) {
    const createData: Parameters<typeof prisma.products.create>[0]["data"] = {
      breeder_id: bid,
      name: name || masterSkuTrim,
      category: category ?? null,
      strain_dominance: strain_dominance ?? null,
      master_sku: masterSkuTrim,
      is_active: true,
      price: 0,
      stock: 0,
      ...(hasFloweringKey
        ? flowering_type === null
          ? { flowering_type: null, category_id: cid }
          : ftNorm === FLOWERING_DB_PHOTO_3N
            ? { flowering_type: FLOWERING_DB_PHOTO_3N, category_id: null }
            : { category_id: cid }
        : { category_id: cid }),
    };
    product = await prisma.products.create({
      data: createData,
      include: { product_variants: true },
    });
  } else {
    const updateData: Record<string, unknown> = {
      ...(product.breeder_id == null ? { breeder_id: bid } : {}),
      name: name || product.name,
      category: category ?? product.category ?? null,
      ...(strain_dominance !== undefined && { strain_dominance }),
    };
    if (hasFloweringKey) {
      if (flowering_type === null) {
        updateData.flowering_type = null;
        updateData.category_id = cid;
      } else if (ftNorm === FLOWERING_DB_PHOTO_3N) {
        updateData.flowering_type = FLOWERING_DB_PHOTO_3N;
        updateData.category_id = null;
      }
    } else if (cid != null) {
      updateData.category_id = cid;
    }
    await prisma.products.update({
      where: { id: product.id },
      data: updateData as Parameters<typeof prisma.products.update>[0]["data"],
    });
  }

  const rawByPack =
    byPack && typeof byPack === "object" && !Array.isArray(byPack) ? (byPack as Record<string, unknown>) : {};

  for (const [key, data] of Object.entries(rawByPack)) {
    const packSize = parseInt(key, 10);
    if (Number.isNaN(packSize) || packSize < 1 || packSize > 99) continue;
    if (data == null || typeof data !== "object" || Array.isArray(data) || typeof data === "number") continue;
    const cell = data as Record<string, unknown>;
    if (!("stock" in cell) && !("price" in cell) && !("cost" in cell)) continue;
    const stock = Math.max(0, Number(cell.stock) || 0);
    const cost = Math.max(0, Number(cell.cost) || 0);
    const price = Math.max(0, Number(cell.price) || 0);
    const label = packToLabel(packSize);
    const sku = toVariantSku(masterSkuTrim, label);

    const existing = product.product_variants.find(
      (v) => parsePackFromUnitLabel(v.unit_label) === packSize
    );

    const hasEconomics = stock > 0 || price > 0 || cost > 0;

    if (existing) {
      await prisma.product_variants.update({
        where: { id: existing.id },
        data: {
          unit_label: label,
          stock: Math.max(0, stock),
          cost_price: cost,
          price: Math.max(0, price),
          sku,
          is_active: true,
        },
      });
    } else if (hasEconomics) {
      const created = await prisma.product_variants.create({
        data: {
          product_id: product.id,
          unit_label: label,
          price,
          stock,
          cost_price: cost,
          sku,
          is_active: true,
        },
      });
      product.product_variants = [...product.product_variants, created];
    }
  }

  const allVariants = await prisma.product_variants.findMany({
    where: { product_id: product.id, is_active: true },
    select: { price: true, stock: true },
  });
  const totalStock = allVariants.reduce((s, x) => s + Number(x.stock ?? 0), 0);
  const minPrice = Math.min(
    ...allVariants.map((x) => Number(x.price)).filter((n) => n > 0),
    Infinity
  ) || 0;
  await prisma.products.update({
    where: { id: product.id },
    data: { stock: totalStock, price: minPrice },
  });

  const updated = await prisma.products.findUnique({
    where: { id: product.id },
    include: {
      product_variants: { where: { is_active: true }, orderBy: { unit_label: "asc" } },
      product_categories: true,
    },
  });

  let gridRow: Record<string, unknown> | null = null;
  if (updated) {
    const p = updated;
    const variantByPackSize = new Map<number, (typeof p.product_variants)[0]>();
    for (const v of p.product_variants) {
      const ps = parsePackFromUnitLabel(v.unit_label);
      if (!variantByPackSize.has(ps)) variantByPackSize.set(ps, v);
    }
    const fromReq = Array.isArray(packSizes)
      ? packSizes.filter((n) => typeof n === "number" && n >= 1 && n <= 99)
      : [];
    const sizeSet = new Set<number>(fromReq.length ? fromReq : []);
    for (const k of Object.keys(rawByPack)) {
      const n = parseInt(k, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= 99) sizeSet.add(n);
    }
    for (const v of p.product_variants) {
      const ps = parsePackFromUnitLabel(v.unit_label);
      if (ps) sizeSet.add(ps);
    }
    const allSizes = [...sizeSet].sort((a, b) => a - b);
    const byPackOut: Record<string, { stock: number; cost: number; price: number }> = {};
    const variantIdsByPack: Record<string, number | null> = {};
    const lowStockThresholdByPack: Record<string, number> = {};
    for (const packSize of allSizes) {
      const v = variantByPackSize.get(packSize);
      const key = String(packSize);
      const stock = v != null ? Math.max(0, Number(v.stock) || 0) : 0;
      const cost = v != null ? Math.max(0, Number((v as { cost_price?: unknown }).cost_price) || 0) : 0;
      const price = v != null ? Math.max(0, Number(v.price) || 0) : 0;
      byPackOut[key] = { stock, cost, price };
      variantIdsByPack[key] = v ? Number(v.id) : null;
      const vExt = v as { low_stock_threshold?: number } | undefined;
      lowStockThresholdByPack[key] =
        vExt?.low_stock_threshold != null ? Number(vExt.low_stock_threshold) : 5;
    }
    const primaryImg =
      Array.isArray(p.image_urls) && (p.image_urls as string[]).length > 0
        ? (p.image_urls as string[])[0]
        : p.image_url ?? null;
    const pc = p.product_categories;
    const ftRow = String((p as { flowering_type?: string | null }).flowering_type ?? "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    const isPhoto3n = ftRow === FLOWERING_DB_PHOTO_3N;
    gridRow = {
      productId: Number(p.id),
      masterSku: p.master_sku ?? "",
      name: p.name,
      imageUrl: primaryImg,
      strainDominance: p.strain_dominance ?? null,
      category: isPhoto3n
        ? "Photo 3N"
        : pc?.name ??
          (p.category === "Photo (FF)" ? "Photo" : p.category === "Seeds" ? "" : p.category ?? ""),
      productCategory: isPhoto3n
        ? { id: FLOWERING_DB_PHOTO_3N, name: "Photo 3N" }
        : pc
          ? { id: String(pc.id), name: pc.name }
          : null,
      categoryId: isPhoto3n ? FLOWERING_DB_PHOTO_3N : p.category_id != null ? String(p.category_id) : undefined,
      floweringType: ftRow || null,
      packs: allSizes,
      byPack: byPackOut,
      variantIdsByPack,
      lowStockThresholdByPack,
    };
  }

    return NextResponse.json(
      bigintToJson({
        created: wasCreated,
        productId: Number(updated?.id),
        masterSku: updated?.master_sku,
        slug: updated?.id,
        gridRow,
      })
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
