import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/** Names for brand promotion rules (must match `breeders.name` exactly). Active = not explicitly false. */
export async function GET() {
  try {
    await assertAdmin();
    const rows = await prisma.breeders.findMany({
      where: {
        NOT: { is_active: false },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      rows.map((r) => ({ id: r.id.toString(), name: r.name.trim() })).filter((r) => r.name.length > 0),
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
