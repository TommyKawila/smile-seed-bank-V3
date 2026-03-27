import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { variantIds?: number[] };
    const ids = Array.isArray(body.variantIds) ? body.variantIds : [];
    const uniq = [
      ...new Set(ids.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)),
    ];
    if (uniq.length === 0) return NextResponse.json({ stocks: {} as Record<string, number> });

    const rows = await prisma.product_variants.findMany({
      where: { id: { in: uniq.map((id) => BigInt(id)) } },
      select: { id: true, stock: true },
    });
    const stocks: Record<string, number> = {};
    for (const r of rows) stocks[String(r.id)] = r.stock ?? 0;
    return NextResponse.json({ stocks });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
