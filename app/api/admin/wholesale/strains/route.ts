import { requireAdminUser } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createWholesaleStrain,
  listWholesaleStrains,
} from "@/services/wholesale-catalog-service";

export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  typeLabel: z.string().max(64).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const strains = await listWholesaleStrains();
    return NextResponse.json({ strains });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;
  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const strain = await createWholesaleStrain(parsed.data);
    return NextResponse.json({ strain });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
