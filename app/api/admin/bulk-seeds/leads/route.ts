import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth-utils";
import { createBulkShareLead, listBulkShareLeads } from "@/services/bulk-share-lead-service";
import { buildManualBulkLeadInput, type ManualBulkLeadLineInput } from "@/lib/bulk-share-manual-lead";
import type { BulkShareLeadStatus } from "@/types/bulk-share-lead";
import type { BulkSupplierSlug } from "@/lib/bulk-seeds-book";

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

export async function POST(req: NextRequest) {
  const gate = await requireAdminUser();
  if (!gate.ok) return gate.response;

  let body: {
    contactName?: string;
    email?: string;
    lineId?: string;
    phone?: string;
    note?: string;
    shareTitle?: string;
    eurThb?: number;
    lines?: ManualBulkLeadLineInput[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slugs = new Set<BulkSupplierSlug>(["green-future", "seeds-genetics"]);
  const lines = (body.lines ?? []).filter(
    (l): l is ManualBulkLeadLineInput =>
      Boolean(l) && slugs.has(l.supplierSlug as BulkSupplierSlug)
  );

  const built = buildManualBulkLeadInput({
    contactName: body.contactName ?? "",
    email: body.email,
    lineId: body.lineId,
    phone: body.phone,
    note: body.note,
    shareTitle: body.shareTitle,
    eurThb: body.eurThb,
    lines,
  });
  if (!built.ok) return NextResponse.json({ error: built.error }, { status: 400 });

  try {
    const lead = await createBulkShareLead(built.input);
    return NextResponse.json({ lead, refNumber: lead.refNumber });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
