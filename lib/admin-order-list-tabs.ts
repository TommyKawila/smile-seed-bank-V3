export type OrderListTabId = "" | "waiting" | "paid" | "shipped" | "completed" | "cancelled";
export type OrderListCountKey = "waiting" | "paid" | "shipped" | "completed" | "cancelled";

export const ORDER_LIST_TABS: {
  id: OrderListTabId;
  label: string;
  countKey: OrderListCountKey | null;
}[] = [
  { id: "", label: "ทั้งหมด", countKey: null },
  { id: "waiting", label: "รอชำระ / สลิป", countKey: "waiting" },
  { id: "paid", label: "ชำระแล้ว (แพ็ค)", countKey: "paid" },
  { id: "shipped", label: "จัดส่งแล้ว", countKey: "shipped" },
  { id: "completed", label: "เสร็จสิ้น", countKey: "completed" },
  { id: "cancelled", label: "ยกเลิก / Void", countKey: "cancelled" },
];

export function parseOrderListTab(raw: string | null): OrderListTabId {
  if (raw === "all") return "";
  if (raw === "") return "";
  if (raw && ORDER_LIST_TABS.some((t) => t.id === raw)) return raw as OrderListTabId;
  return "waiting";
}

export function adminOrdersListHref(tab: OrderListTabId): string {
  if (tab === "") return "/admin/orders?tab=all";
  return `/admin/orders?tab=${tab}`;
}
