import { NextResponse } from "next/server";
import { z } from "zod";
import { captureGacpInquiry } from "@/services/wholesale-rfq-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
  licenseStatus: z.enum(["active", "pending"]).optional(),
  estimatedQty: z.string().trim().max(100).optional(),
  message: z.string().trim().max(4000).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }

  try {
    await captureGacpInquiry(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/wholesale/gacp-inquiry]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save inquiry" },
      { status: 500 }
    );
  }
}
