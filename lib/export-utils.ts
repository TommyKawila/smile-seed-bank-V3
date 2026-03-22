import * as XLSX from "xlsx";

export type OrderExportRow = {
  orderDate: string | null;
  orderNumber: string;
  customerName: string;
  channel: string;
  lineCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
};

function formatDdMmYyyy(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const HEADERS = [
  "วันที่ออเดอร์",
  "เลขที่ออเดอร์",
  "ชื่อลูกค้า",
  "ช่องทาง (Web/POS)",
  "จำนวนรายการ",
  "ยอดรวมสินค้า (Subtotal)",
  "ค่าจัดส่ง",
  "ส่วนลด",
  "ยอดเงินสุทธิ (Total)",
] as const;

export function exportOrdersToExcel(orders: OrderExportRow[], filename: string): void {
  const data: (string | number)[][] = [
    [...HEADERS],
    ...orders.map((o) => [
      formatDdMmYyyy(o.orderDate),
      o.orderNumber,
      o.customerName,
      o.channel,
      o.lineCount,
      Number(o.subtotal.toFixed(2)),
      Number(o.shippingFee.toFixed(2)),
      Number(o.discountAmount.toFixed(2)),
      Number(o.totalAmount.toFixed(2)),
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const colW = [{ wch: 12 }, { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 18 }];
  ws["!cols"] = colW;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
