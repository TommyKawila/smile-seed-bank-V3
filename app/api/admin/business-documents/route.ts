import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import {
  listBusinessDocuments,
  saveBusinessDocument,
} from "@/services/business-document-service";

export const dynamic = "force-dynamic";

const SaveSchema = z.object({
  id: z.string().optional().nullable(),
  recipientEmail: z.string().max(320).optional().default(""),
  recipientName: z.string().min(1).max(200),
  brandName: z.string().min(1).max(120),
  senderName: z.string().min(1).max(120),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bodyText: z.string().min(1).max(50000),
  subject: z.string().min(1).max(300),
  signatureImageUrl: z
    .union([z.string().url().max(2000), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(["DRAFT", "SENT"]).optional(),
});

export async function GET() {
  try {
    await assertAdmin();
    const docs = await listBusinessDocuments();
    return NextResponse.json({ documents: docs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
    const raw = await req.json().catch(() => ({}));
    const parsed = SaveSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const doc = await saveBusinessDocument({
      ...parsed.data,
      signatureImageUrl: parsed.data.signatureImageUrl ?? null,
      status: parsed.data.status ?? "DRAFT",
    });
    return NextResponse.json({ document: doc });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
