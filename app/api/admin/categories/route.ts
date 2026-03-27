import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintToJson } from "@/lib/bigint-json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.product_categories.findMany({
      orderBy: { sort_order: "asc" },
      select: { id: true, name: true, sort_order: true },
    });
    return NextResponse.json(
      bigintToJson(categories.map((c) => ({ id: String(c.id), name: c.name, sort_order: c.sort_order })))
    );
  } catch (e) {
    return NextResponse.json(bigintToJson([]), { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, sort_order } = body as { name: string; sort_order?: number };
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const created = await prisma.product_categories.create({
      data: { name: name.trim(), sort_order: typeof sort_order === "number" ? sort_order : 0 },
    });
    return NextResponse.json(bigintToJson({ id: String(created.id), name: created.name, sort_order: created.sort_order }), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
