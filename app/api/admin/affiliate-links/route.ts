import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.affiliate_links.findMany({
      orderBy: { updated_at: "desc" },
    });
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        id: Number(r.id),
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const url = String(body.url ?? "").trim();
    const platform_name = String(body.platform_name ?? "").trim();
    if (!title || !url || !platform_name) {
      return NextResponse.json(
        { error: "title, url, and platform_name required" },
        { status: 400 }
      );
    }
    const created = await prisma.affiliate_links.create({
      data: {
        title,
        url,
        platform_name,
        image_url: body.image_url?.trim() || null,
      },
    });
    return NextResponse.json({ ...created, id: Number(created.id) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
