import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { sendBusinessDocumentEmail } from "@/services/business-document-service";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email"),
  recipientName: z.string().min(1).max(200),
  brandName: z.string().min(1).max(120),
  senderName: z.string().min(1).max(120),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  bodyText: z.string().max(50000).refine((value) => value.trim().length > 0, {
    message: "Document body is required",
  }),
});

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }

    const result = await sendBusinessDocumentEmail(parsed.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("unauthorized") ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
