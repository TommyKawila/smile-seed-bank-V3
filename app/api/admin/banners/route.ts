import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth-utils";
import { createBanner, getAdminBanners, normalizeBannerApiBody } from "@/services/banner-service";

async function readJsonObject(req: Request): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; error: string }> {
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
    return NextResponse.json({ banners: await getAdminBanners() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load banners";
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
      normalized = normalizeBannerApiBody(read.body);
    } catch (scheduleErr) {
      const msg =
        scheduleErr instanceof Error ? scheduleErr.message : "Invalid schedule";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (!normalized.desktop_image_th) {
      return NextResponse.json(
        { error: "Primary Thai desktop image (desktop_image_th) is required" },
        { status: 400 }
      );
    }
    const banner = await createBanner(normalized);
    revalidatePath("/");
    return NextResponse.json({ banner });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save banner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
