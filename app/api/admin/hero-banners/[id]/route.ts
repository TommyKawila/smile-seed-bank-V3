import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth-utils";
import {
  deleteHeroBanner,
  updateHeroBanner,
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

function heroBannerId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) throw new Error("Invalid hero banner id");
  return BigInt(raw);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const banner = await updateHeroBanner(heroBannerId(id), normalized);
    revalidatePath("/");
    return NextResponse.json({ banner });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update hero banner";
    const status = message === "Hero banner not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await assertAdmin();
    await deleteHeroBanner(heroBannerId(id));
    revalidatePath("/");
    revalidateTag("home-hero-banners");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete hero banner";
    const status = message === "Hero banner not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
