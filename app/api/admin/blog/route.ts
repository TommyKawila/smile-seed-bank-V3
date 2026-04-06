import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const where: Prisma.blog_postsWhereInput = {};
    if (categoryId && categoryId !== "all") {
      where.category_id = BigInt(categoryId);
    }
    if (status && status !== "all") {
      where.status = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    }
    if (q) {
      where.title = { contains: q, mode: "insensitive" };
    }

    const posts = await prisma.blog_posts.findMany({
      where,
      orderBy: { updated_at: "desc" },
      include: { blog_categories: true },
    });
    const serialized = posts.map(({ blog_categories: cat, ...p }) => ({
      id: Number(p.id),
      title: p.title,
      slug: p.slug,
      content: p.content,
      excerpt: p.excerpt,
      featured_image: p.featured_image,
      author_id: p.author_id,
      status: p.status,
      published_at: p.published_at?.toISOString() ?? null,
      tags: p.tags,
      related_products: (p.related_products ?? []).map((x) => Number(x)),
      category_id: p.category_id != null ? Number(p.category_id) : null,
      is_highlight: p.is_highlight,
      view_count: p.view_count,
      manual_rank: p.manual_rank,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
      category: cat
        ? {
            id: Number(cat.id),
            name: cat.name,
            slug: cat.slug,
          }
        : null,
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
      category_id,
      is_highlight,
      manual_rank,
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
      category_id:
        category_id != null && category_id !== ""
          ? BigInt(Number(category_id))
          : null,
      is_highlight: Boolean(is_highlight),
      manual_rank: Number(manual_rank) || 0,
    };
    const created = await prisma.blog_posts.create({ data });
    return NextResponse.json({
      id: Number(created.id),
      title: created.title,
      slug: created.slug,
      content: created.content,
      excerpt: created.excerpt,
      featured_image: created.featured_image,
      author_id: created.author_id,
      status: created.status,
      published_at: created.published_at?.toISOString() ?? null,
      tags: created.tags,
      related_products: (created.related_products ?? []).map((x) => Number(x)),
      category_id: created.category_id != null ? Number(created.category_id) : null,
      is_highlight: created.is_highlight,
      view_count: created.view_count,
      manual_rank: created.manual_rank,
      created_at: created.created_at.toISOString(),
      updated_at: created.updated_at.toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
