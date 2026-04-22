import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const patchBodySchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().min(1),
      sort_order: z.number().int().min(0),
      is_active: z.boolean(),
      label_th: z.string().min(1).max(240),
      label_en: z.string().min(1).max(240),
    })
  ),
});

export async function GET() {
  try {
    await assertAdmin();
    const rows = await prisma.homepage_sections.findMany({
      orderBy: { sort_order: "asc" },
    });
    return NextResponse.json({ sections: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    logger.error("homepage sections GET", { cause: err });
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

    const { sections } = parsed.data;
    await prisma.$transaction(
      sections.map((s) =>
        prisma.homepage_sections.update({
          where: { id: s.id },
          data: {
            sort_order: s.sort_order,
            is_active: s.is_active,
            label_th: s.label_th,
            label_en: s.label_en,
          },
        })
      )
    );

    revalidatePath("/");
    revalidateTag("home-layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    logger.error("homepage sections PATCH", { cause: err });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
