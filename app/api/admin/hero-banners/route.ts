import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth-utils";
import {
  createHeroBanner,
  getAdminHeroBanners,
} from "@/services/hero-banner-service";
import { normalizeHeroBannerBody } from "@/lib/hero-banner-admin";

async function readJsonObject(
  req: Request
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const text = await req.text();
    if (!text.trim()) return { ok: true, body: {} };
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: true, body: {} };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
}

export async function GET() {
  try {
    await assertAdmin();
    return NextResponse.json({ banners: await getAdminHeroBanners() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load hero banners";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await assertAdmin();
    const read = await readJsonObject(req);
    if (!read.ok) {
      return NextResponse.json({ error: read.error }, { status: 400 });
    }
    let normalized;
    try {
      normalized = normalizeHeroBannerBody(read.body);
    } catch (scheduleErr) {
      const msg = scheduleErr instanceof Error ? scheduleErr.message : "Invalid schedule";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (!normalized.titleTh.trim()) {
      return NextResponse.json({ error: "titleTh (Thai title / image alt) is required" }, { status: 400 });
    }
    if (!normalized.desktopTh.trim()) {
      return NextResponse.json({ error: "desktopTh (Thai desktop image) is required" }, { status: 400 });
    }
    const banner = await createHeroBanner(normalized);
    revalidatePath("/");
    revalidateTag("home-hero-banners");
    return NextResponse.json({ banner });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save hero banner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
