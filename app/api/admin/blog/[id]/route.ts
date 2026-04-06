import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = BigInt((await params).id);
    const post = await prisma.blog_posts.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "ไม่พบบทความ" }, { status: 404 });
    return NextResponse.json({
      id: Number(post.id),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featured_image: post.featured_image,
      author_id: post.author_id,
      status: post.status,
      published_at: post.published_at?.toISOString() ?? null,
      tags: post.tags,
      related_products: (post.related_products ?? []).map((x) => Number(x)),
      category_id: post.category_id != null ? Number(post.category_id) : null,
      is_highlight: post.is_highlight,
      view_count: post.view_count,
      manual_rank: post.manual_rank,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = BigInt((await params).id);
    const body = await req.json();
    const data = {
      ...(body.title != null && { title: String(body.title).trim() }),
      ...(body.slug != null && { slug: String(body.slug).trim().toLowerCase().replace(/\s+/g, "-") }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.excerpt !== undefined && { excerpt: body.excerpt?.trim() || null }),
      ...(body.featured_image !== undefined && { featured_image: body.featured_image?.trim() || null }),
      ...(body.status != null && { status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT" }),
      ...(body.status === "PUBLISHED" && body.published_at && { published_at: new Date(body.published_at) }),
      ...(Array.isArray(body.tags) && { tags: body.tags }),
      ...(Array.isArray(body.related_products) && {
        related_products: body.related_products.map((x: unknown) => BigInt(Number(x))),
      }),
      ...(body.category_id !== undefined && {
        category_id:
          body.category_id != null && body.category_id !== ""
            ? BigInt(Number(body.category_id))
            : null,
      }),
      ...(body.is_highlight !== undefined && { is_highlight: Boolean(body.is_highlight) }),
      ...(body.manual_rank !== undefined && { manual_rank: Number(body.manual_rank) || 0 }),
      ...(body.view_count !== undefined && { view_count: Math.max(0, Number(body.view_count) || 0) }),
    };
    const updated = await prisma.blog_posts.update({ where: { id }, data });
    return NextResponse.json({
      id: Number(updated.id),
      title: updated.title,
      slug: updated.slug,
      content: updated.content,
      excerpt: updated.excerpt,
      featured_image: updated.featured_image,
      author_id: updated.author_id,
      status: updated.status,
      published_at: updated.published_at?.toISOString() ?? null,
      tags: updated.tags,
      related_products: (updated.related_products ?? []).map((x) => Number(x)),
      category_id: updated.category_id != null ? Number(updated.category_id) : null,
      is_highlight: updated.is_highlight,
      view_count: updated.view_count,
      manual_rank: updated.manual_rank,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
