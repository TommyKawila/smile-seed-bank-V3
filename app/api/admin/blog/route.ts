import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.blog_posts.findMany({
      orderBy: { updated_at: "desc" },
    });
    const serialized = posts.map((p) => ({
      ...p,
      id: Number(p.id),
      related_products: (p.related_products ?? []).map((x) => Number(x)),
    }));
    return NextResponse.json(serialized);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      author_id,
      status,
      published_at,
      tags,
      related_products,
    } = body;
    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "กรุณากรอก title และ slug" },
        { status: 400 }
      );
    }
    const data = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      content: content ?? null,
      excerpt: excerpt?.trim() || null,
      featured_image: featured_image?.trim() || null,
      author_id: author_id || null,
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      published_at: status === "PUBLISHED" && published_at ? new Date(published_at) : null,
      tags: Array.isArray(tags) ? tags : [],
      related_products: Array.isArray(related_products)
        ? related_products.map((x: unknown) => BigInt(Number(x)))
        : [],
    };
    const created = await prisma.blog_posts.create({ data });
    return NextResponse.json({
      ...created,
      id: Number(created.id),
      related_products: (created.related_products ?? []).map((x) => Number(x)),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
