import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ก-๙]+/g, "");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let bid: bigint;
  try {
    bid = BigInt(id);
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  if (bid < 1n) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await req.json();
    const nameIn = body.name != null ? String(body.name).trim() : undefined;
    const slugIn = body.slug != null ? normalizeSlug(String(body.slug)) : undefined;
    const description =
      body.description != null ? String(body.description).trim() || null : undefined;
    const sortOrder =
      body.sort_order != null ? Number(body.sort_order) : undefined;

    const data: {
      name?: string;
      slug?: string;
      description?: string | null;
      sort_order?: number;
    } = {};

    if (nameIn !== undefined) {
      if (!nameIn) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      data.name = nameIn;
    }
    if (slugIn !== undefined) {
      if (!slugIn) {
        return NextResponse.json({ error: "slug cannot be empty" }, { status: 400 });
      }
      const clash = await prisma.blog_categories.findFirst({
        where: { slug: slugIn, NOT: { id: bid } },
      });
      if (clash) {
        return NextResponse.json({ error: "slug already in use" }, { status: 409 });
      }
      data.slug = slugIn;
    }
    if (description !== undefined) data.description = description;
    if (sortOrder !== undefined && !Number.isNaN(sortOrder)) data.sort_order = sortOrder;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    const updated = await prisma.blog_categories.update({
      where: { id: bid },
      data,
    });
    return NextResponse.json({
      ...updated,
      id: Number(updated.id),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let bid: bigint;
  try {
    bid = BigInt(id);
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  if (bid < 1n) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.blog_categories.delete({ where: { id: bid } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
