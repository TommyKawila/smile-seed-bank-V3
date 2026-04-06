import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const productPick = {
  id: true,
  name: true,
  slug: true,
  image_url: true,
  price: true,
  breeders: { select: { name: true } },
} satisfies Prisma.productsSelect;

type ProductPick = Prisma.productsGetPayload<{ select: typeof productPick }>;

function serialize(row: ProductPick) {
  const price = row.price != null ? Number(row.price) : null;
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    image_url: row.image_url,
    breeder_name: row.breeders?.name ?? null,
    price: Number.isFinite(price) ? price : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length === 0) return NextResponse.json([]);
      const rows = await prisma.products.findMany({
        where: { id: { in: ids.map((n) => BigInt(n)) } },
        select: productPick,
      });
      const byId = new Map(rows.map((r) => [Number(r.id), r]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof rows;
      return NextResponse.json(ordered.map(serialize));
    }

    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? "30") || 30, 60);

    const rows = await prisma.products.findMany({
      where: {
        is_active: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { slug: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
      select: productPick,
    });

    return NextResponse.json(rows.map(serialize));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
