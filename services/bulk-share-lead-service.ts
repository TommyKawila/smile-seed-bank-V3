import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  currentBulkShareLeadYear,
  formatBulkShareLeadNumber,
} from "@/lib/bulk-share-lead-number";
import type {
  BulkShareLeadRecord,
  BulkShareLeadStatus,
  CreateBulkShareLeadInput,
} from "@/types/bulk-share-lead";

type LeadWithItems = {
  id: bigint;
  ref_number: string;
  contact_name: string;
  email: string;
  line_id: string;
  phone: string;
  note: string | null;
  share_title: string;
  suppliers: Prisma.JsonValue;
  eur_thb: Prisma.Decimal;
  subtotal_thb: Prisma.Decimal;
  subtotal_eur: Prisma.Decimal;
  seed_count: number;
  status: string;
  created_at: Date;
  items: {
    id: bigint;
    supplier_slug: string;
    supplier_label: string;
    strain_name: string;
    category: string;
    qty: number;
    unit_thb: Prisma.Decimal;
    unit_eur: Prisma.Decimal;
    line_thb: Prisma.Decimal;
    sort_order: number;
  }[];
};

function toNum(d: Prisma.Decimal | number): number {
  return typeof d === "number" ? d : Number(d);
}

function parseSuppliers(json: Prisma.JsonValue): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((s): s is string => typeof s === "string");
}

function toRecord(row: LeadWithItems): BulkShareLeadRecord {
  return {
    id: String(row.id),
    refNumber: row.ref_number,
    contactName: row.contact_name,
    email: row.email,
    lineId: row.line_id,
    phone: row.phone,
    note: row.note,
    shareTitle: row.share_title,
    suppliers: parseSuppliers(row.suppliers),
    eurThb: toNum(row.eur_thb),
    subtotalThb: toNum(row.subtotal_thb),
    subtotalEur: toNum(row.subtotal_eur),
    seedCount: row.seed_count,
    status: (row.status as BulkShareLeadStatus) || "NEW",
    createdAt: row.created_at.toISOString(),
    items: row.items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        id: String(it.id),
        supplierSlug: it.supplier_slug,
        supplierLabel: it.supplier_label,
        strainName: it.strain_name,
        category: it.category,
        qty: it.qty,
        unitThb: toNum(it.unit_thb),
        unitEur: toNum(it.unit_eur),
        lineThb: toNum(it.line_thb),
      })),
  };
}

export async function nextBulkShareLeadRef(): Promise<string> {
  const year = currentBulkShareLeadYear();
  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.bulk_share_lead_yearly_seq.findUnique({ where: { year } });
    if (!existing) {
      return tx.bulk_share_lead_yearly_seq.create({ data: { year, seq: 1 } });
    }
    return tx.bulk_share_lead_yearly_seq.update({
      where: { year },
      data: { seq: { increment: 1 } },
    });
  });
  return formatBulkShareLeadNumber(year, row.seq);
}

export async function createBulkShareLead(input: CreateBulkShareLeadInput): Promise<BulkShareLeadRecord> {
  const refNumber = await nextBulkShareLeadRef();
  const row = await prisma.bulk_share_leads.create({
    data: {
      ref_number: refNumber,
      contact_name: input.contactName.trim().slice(0, 200),
      email: (input.email ?? "").trim().slice(0, 320),
      line_id: (input.lineId ?? "").trim().slice(0, 120),
      phone: (input.phone ?? "").trim().slice(0, 32),
      note: input.note?.trim() || null,
      share_title: input.shareTitle.trim().slice(0, 200),
      suppliers: input.suppliers,
      eur_thb: new Prisma.Decimal(input.eurThb),
      subtotal_thb: new Prisma.Decimal(input.subtotalThb),
      subtotal_eur: new Prisma.Decimal(input.subtotalEur),
      seed_count: input.seedCount,
      status: "NEW",
      items: {
        create: input.items.map((it, i) => ({
          supplier_slug: it.supplierSlug,
          supplier_label: it.supplierLabel,
          strain_name: it.strainName,
          category: it.category,
          qty: it.qty,
          unit_thb: new Prisma.Decimal(it.unitThb),
          unit_eur: new Prisma.Decimal(it.unitEur),
          line_thb: new Prisma.Decimal(it.lineThb),
          sort_order: i,
        })),
      },
    },
    include: { items: true },
  });
  return toRecord(row);
}

export async function listBulkShareLeads(opts?: {
  status?: BulkShareLeadStatus;
  limit?: number;
}): Promise<BulkShareLeadRecord[]> {
  const limit = Math.min(100, Math.max(1, opts?.limit ?? 40));
  const rows = await prisma.bulk_share_leads.findMany({
    where: opts?.status ? { status: opts.status } : undefined,
    orderBy: { created_at: "desc" },
    take: limit,
    include: { items: true },
  });
  return rows.map(toRecord);
}
