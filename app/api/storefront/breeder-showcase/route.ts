import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { breederSlugFromName } from "@/lib/breeder-slug";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalBreeders, grouped] = await Promise.all([
      prisma.breeders.count({ where: { is_active: true } }),
      prisma.products.groupBy({
        by: ["breeder_id"],
        where: { is_active: true, breeder_id: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 48,
      }),
    ]);

    const byId = new Map<string, { id: bigint; name: string; logo_url: string | null }>();
    const breederIds = grouped.map((g) => g.breeder_id).filter((id): id is bigint => id != null);
    if (breederIds.length === 0) {
      return NextResponse.json({ breeders: [], totalBreeders });
    }

    const breederRows = await prisma.breeders.findMany({
      where: {
        id: { in: breederIds },
        is_active: true,
        logo_url: { not: null },
        NOT: { logo_url: "" },
      },
      select: { id: true, name: true, logo_url: true },
    });
    for (const b of breederRows) byId.set(String(b.id), b);

    const breeders: {
      id: number;
      name: string;
      logoUrl: string | null;
      strainCount: number;
      slug: string;
    }[] = [];

    for (const g of grouped) {
      if (g.breeder_id == null || breeders.length >= 12) break;
      const b = byId.get(String(g.breeder_id));
      if (!b || !(b.logo_url ?? "").trim()) continue;
      breeders.push({
        id: Number(b.id),
        name: b.name,
        logoUrl: b.logo_url,
        strainCount: g._count.id,
        slug: breederSlugFromName(b.name),
      });
    }

    return NextResponse.json({ breeders, totalBreeders });
  } catch (e) {
    console.error("[breeder-showcase]", e);
    return NextResponse.json({ breeders: [], totalBreeders: null });
  }
}
