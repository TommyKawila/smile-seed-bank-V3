import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { getMockupById } from "@/services/mockupService";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const data = await getMockupById(id);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    console.error("[mockups GET]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
