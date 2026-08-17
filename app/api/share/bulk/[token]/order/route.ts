import { NextRequest, NextResponse } from "next/server";
import { readBulkShareToken } from "@/lib/bulk-share-token";
import { priceBulkShareOrder, type BulkShareOrderItemInput } from "@/lib/bulk-share-order";
import { createBulkShareLead } from "@/services/bulk-share-lead-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);
  const payload = readBulkShareToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Link expired or invalid" }, { status: 404 });
  }

  let body: {
    contactName?: string;
    lineId?: string;
    phone?: string;
    note?: string;
    items?: BulkShareOrderItemInput[];
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contactName = (body.contactName ?? "").trim();
  if (!contactName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const lineId = (body.lineId ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!lineId && !phone) {
    return NextResponse.json({ error: "LINE ID or phone required" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const priced = priceBulkShareOrder(payload, items);
  if (!priced.ok) {
    return NextResponse.json({ error: priced.error }, { status: 400 });
  }

  try {
    const lead = await createBulkShareLead({
      contactName,
      lineId,
      phone,
      note: body.note,
      shareTitle: payload.title,
      suppliers: payload.suppliers,
      eurThb: payload.eurThb,
      seedCount: priced.totals.seedCount,
      subtotalThb: priced.totals.subtotalThb,
      subtotalEur: priced.totals.subtotalEur,
      items: priced.totals.lines.map((l) => ({
        supplierSlug: l.supplierSlug,
        supplierLabel: l.supplierLabel,
        strainName: l.strainName,
        category: l.category,
        qty: l.qty,
        unitThb: l.unitThb,
        unitEur: l.unitEur,
        lineThb: l.lineThb,
      })),
    });
    return NextResponse.json({ refNumber: lead.refNumber, leadId: lead.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
