import { NextResponse } from "next/server";
import { z } from "zod";
import { captureCoaLead } from "@/services/wholesale-rfq-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(200).optional(),
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
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    await captureCoaLead(parsed.data.email, parsed.data.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/wholesale/coa-lead]", err);
    return NextResponse.json(
      { error: "Failed to save lead" },
      { status: 500 }
    );
  }
}
