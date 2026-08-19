import { DEFAULT_EUR_THB, type BulkSupplierSlug } from "@/lib/bulk-seeds-book";
import { supplierLabel } from "@/lib/bulk-share-order";
import { SGF_SEEDS_SHARE_NAME } from "@/lib/sgf-seeds-share";
import type { CreateBulkShareLeadInput } from "@/types/bulk-share-lead";

export type ManualBulkLeadLineInput = {
  supplierSlug: BulkSupplierSlug;
  strainName: string;
  qty: number;
  unitEur: number;
  category?: string;
};

export function buildManualBulkLeadInput(opts: {
  contactName: string;
  email?: string;
  lineId?: string;
  phone?: string;
  note?: string;
  shareTitle?: string;
  eurThb?: number;
  lines: ManualBulkLeadLineInput[];
}): { ok: true; input: CreateBulkShareLeadInput } | { ok: false; error: string } {
  const contactName = opts.contactName.trim();
  if (!contactName) return { ok: false, error: "Name is required" };

  const email = (opts.email ?? "").trim().toLowerCase();
  const lineId = (opts.lineId ?? "").trim();
  const phone = (opts.phone ?? "").trim();
  if (!email && !lineId && !phone) {
    return { ok: false, error: "LINE ID, phone, or email required" };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }

  const eurThb = opts.eurThb && opts.eurThb > 0 ? opts.eurThb : DEFAULT_EUR_THB;
  const items: CreateBulkShareLeadInput["items"] = [];
  const suppliers = new Set<string>();

  for (const raw of opts.lines) {
    const strainName = raw.strainName.trim();
    const qty = Math.floor(Number(raw.qty));
    const unitEur = Number(raw.unitEur);
    if (!strainName) continue;
    if (!Number.isFinite(qty) || qty <= 0) {
      return { ok: false, error: `Invalid qty for ${strainName}` };
    }
    if (!Number.isFinite(unitEur) || unitEur <= 0) {
      return { ok: false, error: `Invalid unit price for ${strainName}` };
    }
    const unitThb = unitEur * eurThb;
    const lineThb = unitThb * qty;
    const slug = raw.supplierSlug;
    suppliers.add(slug);
    items.push({
      supplierSlug: slug,
      supplierLabel: slug === "green-future" ? SGF_SEEDS_SHARE_NAME : supplierLabel(slug),
      strainName,
      category: (raw.category ?? "").trim(),
      qty,
      unitThb,
      unitEur,
      lineThb,
    });
  }

  if (items.length === 0) return { ok: false, error: "Add at least one strain line" };

  const seedCount = items.reduce((s, it) => s + it.qty, 0);
  const subtotalThb = items.reduce((s, it) => s + it.lineThb, 0);
  const subtotalEur = items.reduce((s, it) => s + it.unitEur * it.qty, 0);
  const noteParts = ["Source: admin manual", opts.note?.trim() || ""].filter(Boolean);

  return {
    ok: true,
    input: {
      contactName,
      email,
      lineId,
      phone,
      note: noteParts.join(" · "),
      shareTitle: (opts.shareTitle ?? "Manual bulk order (chat)").trim().slice(0, 200),
      suppliers: [...suppliers],
      eurThb,
      seedCount,
      subtotalThb,
      subtotalEur,
      items,
    },
  };
}
