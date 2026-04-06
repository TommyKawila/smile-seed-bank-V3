import { NextResponse } from "next/server";
import { incrementBlogPostViewCount } from "@/lib/blog-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.postId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid postId" }, { status: 400 });
    }
    await incrementBlogPostViewCount(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
