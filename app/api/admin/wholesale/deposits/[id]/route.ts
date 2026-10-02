import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth-utils";
import { updateWholesaleDepositStatus } from "@/services/wholesale-deposit-service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  adminNote: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const row = await updateWholesaleDepositStatus({
    id,
    status: parsed.data.status,
    adminNote: parsed.data.adminNote,
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deposit: row });
}
