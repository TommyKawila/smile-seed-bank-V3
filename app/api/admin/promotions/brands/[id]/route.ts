import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";
import { assertAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  brand_name: z.string().min(1).max(200).optional(),
  discount_percent: z.coerce.number().int().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await assertAdmin();
    const { id: idRaw } = await ctx.params;
    const id = BigInt(idRaw);
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 },
      );
    }
    const data: { brand_name?: string; discount_percent?: number; is_active?: boolean } = {};
    if (parsed.data.brand_name != null) data.brand_name = parsed.data.brand_name.trim();
    if (parsed.data.discount_percent != null) data.discount_percent = parsed.data.discount_percent;
    if (parsed.data.is_active != null) data.is_active = parsed.data.is_active;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const row = await prisma.brand_promotions.update({
      where: { id },
      data,
    });
    return NextResponse.json(bigintToJson(row));
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const msg = e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002"
      ? "Duplicate brand name"
      : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await assertAdmin();
    const { id: idRaw } = await ctx.params;
    await prisma.brand_promotions.delete({
      where: { id: BigInt(idRaw) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
