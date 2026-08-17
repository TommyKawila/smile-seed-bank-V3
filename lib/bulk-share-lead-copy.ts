import type { BulkShareLeadRecord } from "@/types/bulk-share-lead";

export function formatBulkShareLeadCopyText(lead: BulkShareLeadRecord): string {
  const lines = [
    lead.refNumber,
    `Offer: ${lead.shareTitle}`,
    `Contact: ${lead.contactName}`,
  ];
  if (lead.lineId) lines.push(`LINE: ${lead.lineId}`);
  if (lead.phone) lines.push(`Phone: ${lead.phone}`);
  if (lead.note) lines.push(`Note: ${lead.note}`);
  lines.push("---");
  for (const it of lead.items) {
    lines.push(
      `${it.supplierLabel} · ${it.strainName} · ${it.qty.toLocaleString()} · €${it.unitEur.toFixed(2)}/seed · ฿${Math.ceil(it.lineThb).toLocaleString("en-US")}`
    );
  }
  lines.push("---");
  lines.push(
    `Total: ${lead.seedCount.toLocaleString()} seeds · ฿${Math.ceil(lead.subtotalThb).toLocaleString("en-US")} · €${lead.subtotalEur.toFixed(2)}`
  );
  lines.push("(Excludes shipping — Smile Seed Bank bulk share lead)");
  return lines.join("\n");
}
