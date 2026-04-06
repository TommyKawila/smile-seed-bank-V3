import { NextRequest, NextResponse } from "next/server";
import { getTrendingPosts, type TrendingMode } from "@/lib/blog-service";

/** Storefront: trending list (mode from site_settings or ?mode= override). */
export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("mode") as TrendingMode | null;
    const posts = await getTrendingPosts(
      12,
      mode === "manual" || mode === "auto" ? mode : undefined
    );
    return NextResponse.json({ posts });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
