import { NextResponse } from "next/server";
import { getHighlightPosts } from "@/lib/blog-service";

/** Storefront: randomized carousel candidates (published + is_highlight). */
export async function GET() {
  try {
    const posts = await getHighlightPosts(24, 12);
    return NextResponse.json({ posts });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
