import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth-utils";
import { listBulkSeeds } from "@/services/bulk-seeds-service";

const QuerySchema = z.object({
  q: z.string().optional(),
  sourceKind: z.string().optional(),
  take: z.coerce.number().min(1).max(2500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await assertAdmin();
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = QuerySchema.safeParse(sp);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }
    const { q, sourceKind, take } = parsed.data;
    const rows = await listBulkSeeds({ q, sourceKind, take });
    return NextResponse.json({ rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load bulk seeds";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
