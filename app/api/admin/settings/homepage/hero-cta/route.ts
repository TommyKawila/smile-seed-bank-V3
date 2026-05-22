import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { listHeroCtaButtons, saveHeroCtaButtons } from "@/services/homepage-hero-cta-service";

const patchBodySchema = z.object({
  buttons: z.array(
    z.object({
      id: z.string().min(1),
      label_th: z.string().min(1).max(120),
      label_en: z.string().min(1).max(120),
      href: z.string().min(1).max(512),
      color: z.enum(["green", "red", "yellow", "outline"]),
      sort_order: z.number().int().min(0),
      is_active: z.boolean(),
    })
  ),
});

export async function GET() {
  try {
    await assertAdmin();
    const buttons = await listHeroCtaButtons(false, { allowFallback: false });
    return NextResponse.json({
      buttons: buttons.map((b) => ({
        id: b.id,
        label_th: b.labelTh,
        label_en: b.labelEn,
        href: b.href,
        color: b.color,
        sort_order: b.sortOrder,
        is_active: b.isActive,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    logger.error("homepage hero cta GET", { cause: err });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await assertAdmin();
    const json = await req.json().catch(() => null);
    const parsed = patchBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    await saveHeroCtaButtons(parsed.data.buttons);
    revalidatePath("/");
    revalidateTag("home-layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    logger.error("homepage hero cta PATCH", { cause: err });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
