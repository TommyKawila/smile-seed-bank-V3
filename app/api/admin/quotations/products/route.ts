import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { parsePackFromUnitLabel } from "@/lib/sku-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const breederId = searchParams.get("breederId");
    const categoryId = searchParams.get("categoryId") ?? "";
    const searchRaw = (searchParams.get("search") ?? "").trim();
    const search = searchRaw.toLowerCase();
    const globalSearch = searchParams.get("globalSearch") === "1" && search.length >= 2;

    const where: Record<string, unknown> = { is_active: true };
    if (breederId && breederId !== "all" && !globalSearch) where.breeder_id = BigInt(breederId);
    if (categoryId && categoryId !== "all" && !globalSearch) where.category_id = BigInt(categoryId);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { master_sku: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const products = await prisma.products.findMany({
      where,
      include: {
        product_variants: { where: { is_active: true }, orderBy: { unit_label: "asc" } },
        product_categories: true,
        breeders: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const rows = products.map((p) => {
      const variantByPack = new Map<number, { variantId: number; stock: number; price: number; unitLabel: string }>();
      for (const v of p.product_variants) {
        const pack = parsePackFromUnitLabel(v.unit_label);
        if (!variantByPack.has(pack)) {
          variantByPack.set(pack, {
            variantId: Number(v.id),
            stock: v.stock ?? 0,
            price: Number(v.price),
            unitLabel: v.unit_label,
          });
        }
      }
      const packs = Array.from(variantByPack.keys()).sort((a, b) => a - b);
      const byPack: Record<number, { variantId: number; stock: number; price: number; unitLabel: string }> = {};
      for (const [pk, v] of variantByPack) byPack[pk] = v;

      const primaryImg = Array.isArray(p.image_urls) && (p.image_urls as string[]).length > 0
        ? (p.image_urls as string[])[0]
        : (p as { image_url?: string | null }).image_url ?? null;

      return {
        productId: Number(p.id),
        masterSku: p.master_sku ?? "",
        name: p.name,
        imageUrl: primaryImg,
        category: (p.product_categories?.name ?? p.category) ?? "",
        breederName: (p.breeders as { name?: string })?.name ?? "",
        packs,
        byPack,
      };
    });

    return NextResponse.json(bigintToJson({ rows }));
  } catch (err) {
    console.error("[quotations/products]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
