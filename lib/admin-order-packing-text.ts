import { formatItemForPacking } from "@/lib/admin-order-line-summary";
import type { AdminOrderLineItem } from "@/types/admin-order";

export type OrderPackingClipboardInput = {
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  customerNote?: string | null;
  items: {
    productName: string;
    unitLabel: string;
    breederName: string | null;
    seedTypeLabel?: string | null;
    quantity: number;
    unitPrice: number;
  }[];
};

function toAdminLineItem(
  item: OrderPackingClipboardInput["items"][number]
): AdminOrderLineItem {
  const seedType = item.seedTypeLabel?.trim() || null;
  return {
    quantity: item.quantity,
    unit_price: item.unitPrice,
    product_name: item.productName,
    unit_label: item.unitLabel?.trim() && item.unitLabel !== "—" ? item.unitLabel.trim() : null,
    variant_unit_label: null,
    subtotal: item.unitPrice * item.quantity,
    breeder_name: item.breederName ?? "",
    flowering_type: null,
    category: seedType,
    product_category_name: seedType,
  };
}

/** Clipboard text for warehouse packing — name, phone, address, detailed lines (no email). */
export function generateOrderPackingDetailsText(input: OrderPackingClipboardInput): string {
  const name = input.customerName?.trim() || "—";
  const phone = input.customerPhone?.trim() || "—";
  const addr = input.shippingAddress?.trim() || "—";
  const note = (input.customerNote ?? "").trim();

  const itemLines =
    input.items.length === 0
      ? ["(ไม่มีรายการ)"]
      : input.items.map((item, idx) => {
          const line = formatItemForPacking(toAdminLineItem(item));
          return `${idx + 1}. ${line}`;
        });

  const parts = [
    `📦 PACKING LIST — #${input.orderNumber}`,
    "",
    `ชื่อ: ${name}`,
    `โทร: ${phone}`,
    "",
    "ที่อยู่จัดส่ง:",
    addr,
    "",
    "────────────────────",
    `รายการสินค้า (${input.items.length} รายการ):`,
    ...itemLines,
    "────────────────────",
  ];

  if (note) {
    parts.push("", `หมายเหตุลูกค้า: ${note}`);
  }

  return parts.join("\n");
}
