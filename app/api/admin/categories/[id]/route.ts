import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bid = BigInt(id);
  if (bid < BigInt(1)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  try {
    const body = await req.json();
    const { name, sort_order } = body as { name?: string; sort_order?: number };
    const data: { name?: string; sort_order?: number } = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof sort_order === "number") data.sort_order = sort_order;
    const updated = await prisma.product_categories.update({
      where: { id: bid },
      data,
    });
    return NextResponse.json(bigintToJson({ id: String(updated.id), name: updated.name, sort_order: updated.sort_order }));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bid = BigInt(id);
  if (bid < BigInt(1)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  try {
    await prisma.products.updateMany({ where: { category_id: bid }, data: { category_id: null } });
    await prisma.product_categories.delete({ where: { id: bid } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
