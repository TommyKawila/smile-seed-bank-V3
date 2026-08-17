import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { listBulkShareLeads } from "@/services/bulk-share-lead-service";
import type { BulkShareLeadStatus } from "@/types/bulk-share-lead";

export const dynamic = "force-dynamic";

const STATUSES = new Set<BulkShareLeadStatus>(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]);

export async function GET(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  const statusParam = req.nextUrl.searchParams.get("status");
  const status =
    statusParam && STATUSES.has(statusParam as BulkShareLeadStatus)
      ? (statusParam as BulkShareLeadStatus)
      : undefined;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 40);

  try {
    const leads = await listBulkShareLeads({ status, limit });
    return NextResponse.json({ leads });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
