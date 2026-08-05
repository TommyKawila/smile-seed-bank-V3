import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { deleteKnowledgeEntry } from "@/services/assistant-knowledge-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await deleteKnowledgeEntry(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/knowledge/[id]] DELETE:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to delete knowledge",
      },
      { status: 500 }
    );
  }
}
