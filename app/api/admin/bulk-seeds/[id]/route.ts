import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { deleteBulkSeed, updateBulkSeed } from "@/services/bulk-seeds-service";

const PatchSchema = z.object({
  code: z.string().max(128).optional(),
  strain: z.string().max(512).optional(),
  thc: z.string().max(128).optional(),
  cycle: z.string().max(128).optional(),
  type: z.string().max(128).optional(),
  flavor: z.string().max(256).optional(),
  tier_prices: z.record(z.string(), z.union([z.number(), z.null()])).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
    const bid = /^\d+$/.test(params.id) ? BigInt(params.id) : null;
    if (bid == null) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const json: unknown = await req.json();
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 }
      );
    }
    const row = await updateBulkSeed(bid, parsed.data);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdmin();
    const bid = /^\d+$/.test(params.id) ? BigInt(params.id) : null;
    if (bid == null) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const ok = await deleteBulkSeed(bid);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
