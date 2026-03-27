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
      ...post,
      id: Number(post.id),
      related_products: (post.related_products ?? []).map((x) => Number(x)),
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
    };
    const updated = await prisma.blog_posts.update({ where: { id }, data });
    return NextResponse.json({
      ...updated,
      id: Number(updated.id),
      related_products: (updated.related_products ?? []).map((x) => Number(x)),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
