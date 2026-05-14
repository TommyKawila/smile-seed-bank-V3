import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { assertAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  brand_name: z.string().min(1, "Brand name required").max(200),
  discount_percent: z.coerce.number().int().min(0).max(100),
  is_active: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    await assertAdmin();
    const rows = await prisma.brand_promotions.findMany({
      orderBy: { brand_name: "asc" },
    });
    return NextResponse.json(bigintToJson(rows));
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 },
      );
    }
    const name = parsed.data.brand_name.trim();
    const row = await prisma.brand_promotions.create({
      data: {
        brand_name: name,
        discount_percent: parsed.data.discount_percent,
        is_active: parsed.data.is_active,
      },
    });
    return NextResponse.json(bigintToJson(row), { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const msg = e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002"
      ? "A rule for this brand name already exists"
      : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
