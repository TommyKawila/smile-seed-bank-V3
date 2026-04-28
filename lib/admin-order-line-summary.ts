import { parsePackFromUnitLabel } from "@/lib/sku-utils";
import { adminOrderLineItemSeedTypeLabel } from "@/lib/seed-type-filter";
import type { AdminOrderLineItem } from "@/types/admin-order";

export function adminOrderLineSeedsPart(li: {
  unit_label: string | null;
  variant_unit_label: string | null;
  quantity: number;
}): string {
  const eff = li.unit_label?.trim() || li.variant_unit_label?.trim() || "";
  if (!eff) return `${li.quantity} เมล็ด`;
  const per = parsePackFromUnitLabel(eff);
  if (per <= 0) return `${li.quantity} เมล็ด`;
  return `${per * li.quantity} เมล็ด`;
}

/** `{ProductName} ({Qty} เมล็ด) — {Breeder} ({SeedType})` for list + mobile summaries */
export function formatAdminOrderLineSummary(li: AdminOrderLineItem): string {
  const seeds = adminOrderLineSeedsPart(li);
  const bre = (() => {
    const s = (li.breeder_name ?? "").trim();
    return s && s !== "—" ? s : "—";
  })();
  const typ = adminOrderLineItemSeedTypeLabel(li);
  return `${li.product_name} (${seeds}) — ${bre} (${typ})`;
}
