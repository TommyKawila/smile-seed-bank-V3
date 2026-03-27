import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { parsePackFromUnitLabel, toBreederPart, toBreederPrefix } from "@/lib/sku-utils";

export const dynamic = "force-dynamic";

function isAllToken(s: string | null | undefined): boolean {
  if (s == null) return true;
  const t = s.trim();
  return t === "" || t.toLowerCase() === "all";
}

/** Only positive integer strings; avoids BigInt("all") / UUID throwing and emptying results via catch. */
function parseBigIntId(raw: string): bigint | null {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return null;
  try {
    return BigInt(t);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const breederId = searchParams.get("breederId");
    const categoryRaw =
      searchParams.get("categoryId") ?? searchParams.get("category") ?? "";
    const dominanceRaw = searchParams.get("dominance") ?? "";
    const categoryId = categoryRaw.trim();
    const dominance = dominanceRaw.trim();
    const wantDebug =
      searchParams.get("debug") === "1" || process.env.NODE_ENV === "development";

    if (!breederId) {
      return NextResponse.json({ error: "breederId required" }, { status: 400 });
    }

    const bid = BigInt(breederId);

    // 1. Breeder row (packages + name for SKU fallback when products.breeder_id is null)
    const breeder = await prisma.breeders.findUnique({
      where: { id: bid },
      select: { name: true, allowed_packages: true },
    });

    const raw = breeder?.allowed_packages as { sizes?: number[]; active?: number[] } | number[] | null;
    const defaultPacks = [1, 2, 3, 5];
    
    const sizes = Array.isArray(raw)
      ? [...new Set(raw.filter((p: number) => p >= 1 && p <= 99))].sort((a, b) => a - b)
      : (raw?.sizes ? [...new Set(raw.sizes.filter((p: number) => p >= 1 && p <= 99))].sort((a, b) => a - b) : defaultPacks);

    const active = Array.isArray(raw)
      ? sizes
      : (raw?.active ? [...new Set(raw.active.filter((p: number) => p >= 1 && p <= 99))].sort((a, b) => a - b) : sizes);
    
    const packs = active.length > 0 ? active : defaultPacks;

    const longSkuPrefix =
      breeder?.name != null && breeder.name.trim() !== ""
        ? `${toBreederPart(breeder.name)}-`
        : null;
    const shortSkuPrefix =
      breeder?.name != null && breeder.name.trim() !== ""
        ? `${toBreederPrefix(breeder.name)}-`
        : null;
    const nullBreederSkuOr: Prisma.productsWhereInput[] = [];
    if (longSkuPrefix) {
      nullBreederSkuOr.push({
        master_sku: { startsWith: longSkuPrefix, mode: "insensitive" },
      });
    }
    if (shortSkuPrefix && shortSkuPrefix !== longSkuPrefix) {
      nullBreederSkuOr.push({
        master_sku: { startsWith: shortSkuPrefix, mode: "insensitive" },
      });
    }

    /** Match by FK, or legacy rows with breeder_id null but master_sku from same brand (import vs Manual short prefix). */
    const breederScope: Prisma.productsWhereInput =
      nullBreederSkuOr.length > 0
        ? {
            OR: [
              { breeder_id: bid },
              {
                AND: [{ breeder_id: null }, { OR: nullBreederSkuOr }],
              },
            ],
          }
        : { breeder_id: bid };

    const applyCategory = !isAllToken(categoryId);
    const categoryBigInt = applyCategory ? parseBigIntId(categoryId) : null;
    if (applyCategory && categoryBigInt == null) {
      console.warn("[Grid API] Ignoring invalid categoryId (expected numeric id):", categoryRaw);
    }
    const applyDominance = !isAllToken(dominance);

    const whereParts: Prisma.productsWhereInput[] = [breederScope];
    if (applyCategory && categoryBigInt != null) {
      whereParts.push({ category_id: categoryBigInt });
    }
    if (applyDominance && dominance) {
      whereParts.push({
        strain_dominance: { contains: dominance, mode: "insensitive" as const },
      });
    }

    const where: Prisma.productsWhereInput =
      whereParts.length === 1 ? whereParts[0]! : { AND: whereParts };

    let gridDebug: Record<string, unknown> | undefined;
    if (wantDebug) {
      const totalProducts = await prisma.products.count();
      const countByBreederId = await prisma.products.count({ where: { breeder_id: bid } });
      const countNullLong =
        longSkuPrefix != null
          ? await prisma.products.count({
              where: {
                breeder_id: null,
                master_sku: { startsWith: longSkuPrefix, mode: "insensitive" },
              },
            })
          : 0;
      const countNullShort =
        shortSkuPrefix != null && shortSkuPrefix !== longSkuPrefix
          ? await prisma.products.count({
              where: {
                breeder_id: null,
                master_sku: { startsWith: shortSkuPrefix, mode: "insensitive" },
              },
            })
          : 0;
      gridDebug = {
        totalProducts,
        countByBreederId,
        countNullWithLongPrefix: countNullLong,
        countNullWithShortPrefix: countNullShort,
        longSkuPrefix,
        shortSkuPrefix,
        breederName: breeder?.name ?? null,
      };
      console.log("[Grid API] params:", {
        breederId,
        bid: String(bid),
        categoryId: categoryId || "(omit)",
        categoryRaw,
        dominance: dominance || "(omit)",
        applyCategory,
        applyDominance,
        longSkuPrefix,
        shortSkuPrefix,
        breederFound: !!breeder,
        where: JSON.stringify(bigintToJson(where)),
      });
      console.log("[Grid API] counts (before main query):", gridDebug);
    }

    /** Narrow select avoids P2022 when DB is behind schema (e.g. missing `seo_meta`). */
    const gridProductSelect = {
      id: true,
      master_sku: true,
      name: true,
      image_url: true,
      image_urls: true,
      category: true,
      category_id: true,
      thc_percent: true,
      terpenes: true,
      strain_dominance: true,
      product_variants: {
        where: { is_active: true },
        orderBy: { unit_label: "asc" as const },
        select: {
          id: true,
          unit_label: true,
          stock: true,
          price: true,
          cost_price: true,
          low_stock_threshold: true,
        },
      },
      product_categories: {
        select: { id: true, name: true },
      },
    } satisfies Prisma.productsSelect;

    let products: Prisma.productsGetPayload<{ select: typeof gridProductSelect }>[];
    try {
      products = await prisma.products.findMany({
        where,
        select: gridProductSelect,
        orderBy: { name: "asc" },
      });
      console.log("[API Internal] Rows found (products):", products.length);
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[API Error]", dbErr);
      return NextResponse.json(
        bigintToJson({
          rows: [],
          allowedPackages: packs,
          packagesConfig: { sizes, active },
          error: msg,
        })
      );
    }

    // 3. แปลงข้อมูลให้อยู่ในรูปแบบ Table Rows
    const rows = products.map((p) => {
      try {
        const variantByPackSize = new Map<number, (typeof p.product_variants)[0]>();
        for (const v of p.product_variants) {
          const packSize = parsePackFromUnitLabel(v.unit_label);
          if (!variantByPackSize.has(packSize)) variantByPackSize.set(packSize, v);
        }

        const allSizes = sizes.length > 0 ? sizes : packs;
        const byPack: Record<string, { stock: number; cost: number; price: number }> = {};
        const variantIdsByPack: Record<string, number | null> = {};
        const lowStockThresholdByPack: Record<string, number> = {};
        for (const packSize of allSizes) {
          const v = variantByPackSize.get(packSize);
          const key = String(packSize);
          const stock = v != null ? Math.max(0, Number(v.stock) || 0) : 0;
          const cost = v != null ? Math.max(0, Number((v as { cost_price?: unknown }).cost_price) || 0) : 0;
          const price = v != null ? Math.max(0, Number(v.price) || 0) : 0;
          byPack[key] = { stock, cost, price };
          variantIdsByPack[key] = v ? Number(v.id) : null;
          const vExt = v as { low_stock_threshold?: number } | undefined;
          lowStockThresholdByPack[key] = vExt?.low_stock_threshold != null ? Number(vExt.low_stock_threshold) : 5;
        }

        const primaryImg = Array.isArray(p.image_urls) && (p.image_urls as string[]).length > 0
          ? (p.image_urls as string[])[0]
          : (p as { image_url?: string | null }).image_url ?? null;
        return {
          productId: Number(p.id),
          masterSku: p.master_sku ?? "",
          name: p.name,
          imageUrl: primaryImg,
          strainDominance: p.strain_dominance ?? null,
          category: p.product_categories?.name ?? (p.category === "Photo (FF)" ? "Photo" : p.category === "Seeds" ? "" : p.category ?? ""),
          productCategory: p.product_categories ? { id: String(p.product_categories.id), name: p.product_categories.name } : null,
          categoryId: p.category_id != null ? String(p.category_id) : undefined,
          thcPercent: p.thc_percent != null ? Number(p.thc_percent) : null,
          terpenes: Array.isArray(p.terpenes) ? (p.terpenes as string[]).join(", ") : (typeof p.terpenes === "string" ? p.terpenes : ""),
          packs,
          byPack,
          variantIdsByPack,
          lowStockThresholdByPack,
        };
      } catch (err) {
        console.error(`Error mapping product ${p.id}:`, err);
        return null;
      }
    }).filter((r): r is NonNullable<typeof r> => r != null);

    const payload: Record<string, unknown> = {
      rows,
      allowedPackages: packs,
      packagesConfig: { sizes, active },
    };

    if (wantDebug && gridDebug) {
      gridDebug.rowCount = rows.length;
      payload._debug = gridDebug;
      console.log("[Grid API] rows returned:", rows.length);
    }

    return NextResponse.json(bigintToJson(payload));

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API Error]", error);
    return NextResponse.json(
      bigintToJson({
        rows: [],
        error: msg,
        allowedPackages: [1, 2, 3, 5],
        packagesConfig: { sizes: [1, 2, 3, 5], active: [1, 2, 3, 5] },
      })
    );
  }
}