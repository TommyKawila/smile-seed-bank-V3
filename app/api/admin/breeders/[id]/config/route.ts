import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PackConfigSchema = z.object({
  sizes: z.array(z.number().int().min(1).max(99)),
  active: z.array(z.number().int().min(1).max(99)),
  manual_grid_extra_packs: z.array(z.number().int().min(1).max(99)).optional(),
}).refine((d) => d.active.every((a) => d.sizes.includes(a)), "active must be subset of sizes");

const ConfigSchema = z.object({
  allowed_packages: z.union([
    PackConfigSchema,
    z.array(z.number().int().min(1).max(99)).transform((arr) => ({ sizes: arr, active: [...arr] })),
  ]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bid = BigInt(id);
  const body = await req.json();
  const parsed = ConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid" },
      { status: 400 }
    );
  }

  try {
    await prisma.breeders.update({
      where: { id: bid },
      data: { allowed_packages: parsed.data.allowed_packages as unknown as object },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
