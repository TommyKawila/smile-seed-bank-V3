import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Top published posts by view_count (admin analytics). */
export async function GET() {
  try {
    const rows = await prisma.blog_posts.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ view_count: "desc" }, { published_at: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        view_count: true,
      },
    });
    const data = rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      slug: r.slug,
      view_count: r.view_count,
    }));
    return NextResponse.json(data);
  } catch (e) {
    console.error("[top-posts]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
