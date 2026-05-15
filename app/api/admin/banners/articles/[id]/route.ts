import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import {
  deleteArticleBanner,
  updateArticleBanner,
} from "@/services/article-banner-service";

const ArticleBannerPatchSchema = z
  .object({
    desktopImageUrl: z.string().trim().nullable().optional(),
    mobileImageUrl: z.string().trim().nullable().optional(),
    titleAlt: z.string().trim().min(1).optional(),
    destinationUrl: z.string().trim().optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();

function articleBannerId(raw: string): bigint {
  if (!/^\d+$/.test(raw)) throw new Error("Invalid article banner id");
  return BigInt(raw);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = ArticleBannerPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join("; ") || "Invalid payload" },
        { status: 400 }
      );
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const banner = await updateArticleBanner(articleBannerId(params.id), parsed.data);
    revalidatePath("/blog");
    return NextResponse.json({ banner });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update article banner";
    const status = message === "Article banner not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdmin();
    await deleteArticleBanner(articleBannerId(params.id));
    revalidatePath("/blog");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete article banner";
    const status = message === "Article banner not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
