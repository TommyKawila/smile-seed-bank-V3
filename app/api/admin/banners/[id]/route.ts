import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth-utils";
import { deleteBanner, normalizeBannerApiBody, updateBanner } from "@/services/banner-service";

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

function bannerId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) throw new Error("Invalid banner id");
  return BigInt(raw);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
    const banner = await updateBanner(bannerId(params.id), normalized);
    revalidatePath("/");
    return NextResponse.json({ banner });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update banner";
    const status = message === "Banner not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    await deleteBanner(bannerId(params.id));
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete banner";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
