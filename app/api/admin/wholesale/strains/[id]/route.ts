import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteWholesaleStrain,
  updateWholesaleStrain,
} from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  typeLabel: z.string().max(64).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const strain = await updateWholesaleStrain(id, parsed.data);
    if (!strain) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ strain });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const ok = await deleteWholesaleStrain(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
