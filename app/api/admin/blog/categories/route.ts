import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.blog_categories.findMany({
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(
      rows.map((c) => ({
        ...c,
        id: Number(c.id),
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const slug =
      String(body.slug ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-") ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-ก-๙]+/g, "");
    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }
    const created = await prisma.blog_categories.create({
      data: {
        name,
        slug,
        description: body.description?.trim() || null,
        sort_order: Number(body.sort_order) || 0,
      },
    });
    return NextResponse.json({ ...created, id: Number(created.id) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
