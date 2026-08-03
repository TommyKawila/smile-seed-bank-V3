import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import {
  deleteBusinessDocument,
  getBusinessDocument,
  saveBusinessDocument,
} from "@/services/business-document-service";

export const dynamic = "force-dynamic";

const SaveSchema = z.object({
  recipientEmail: z.string().max(320).optional().default(""),
  recipientName: z.string().max(200),
  brandName: z.string().max(120),
  senderName: z.string().max(120),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bodyText: z.string().min(1).max(50000),
  subject: z.string().min(1).max(300),
  signatureImageUrl: z
    .union([z.string().url().max(2000), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(["DRAFT", "SENT"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    await assertAdmin();
    const { id } = await ctx.params;
    const doc = await getBusinessDocument(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ document: doc });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    await assertAdmin();
    const { id } = await ctx.params;
    const existing = await getBusinessDocument(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const raw = await req.json().catch(() => ({}));
    const parsed = SaveSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const doc = await saveBusinessDocument({
      id,
      ...parsed.data,
      signatureImageUrl: parsed.data.signatureImageUrl ?? null,
      status: parsed.data.status ?? existing.status,
    });
    return NextResponse.json({ document: doc });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    await assertAdmin();
    const { id } = await ctx.params;
    await deleteBusinessDocument(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
