import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public: active brand promotion rows for client cart math (no secrets). */
export async function GET() {
  try {
    const rows = await prisma.brand_promotions.findMany({
      where: { is_active: true },
      orderBy: { brand_name: "asc" },
      select: {
        brand_name: true,
        discount_percent: true,
        is_active: true,
      },
    });
    return NextResponse.json(
      { rules: rows },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (e) {
    console.error("GET /api/storefront/brand-promotions", e);
    return NextResponse.json(
      { rules: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  }
}
