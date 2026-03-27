import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json([]);

  try {
    const products = await prisma.products.findMany({
    where: {
      is_active: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { master_sku: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      product_variants: {
        where: { is_active: true },
        select: { id: true, unit_label: true, price: true, stock: true, sku: true },
      },
      breeders: { select: { name: true } },
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  const result = products
    .filter((p) => p.product_variants.length > 0)
    .map((p) => ({
      id: Number(p.id),
      name: p.name,
      masterSku: p.master_sku ?? "",
      brand: p.breeders?.name ?? "",
      variants: p.product_variants.map((v) => ({
        id: Number(v.id),
        unitLabel: v.unit_label,
        price: Number(v.price),
        stock: v.stock ?? 0,
        sku: v.sku,
      })),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
