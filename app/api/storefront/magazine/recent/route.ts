import { NextResponse } from "next/server";
import { getRecentPublishedPosts } from "@/lib/blog-service";

export const revalidate = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("take");
  const take = Math.min(12, Math.max(1, raw ? parseInt(raw, 10) || 4 : 4));
  try {
    const posts = await getRecentPublishedPosts(take);
    return NextResponse.json(
      { posts },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
