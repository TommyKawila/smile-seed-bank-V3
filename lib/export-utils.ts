import ExcelJS from "exceljs";

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

/** Client-safe XLSX download (replaces unmaintained `xlsx` package). */
export async function exportOrdersToExcel(
  orders: OrderExportRow[],
  filename: string
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sales");
  ws.addRow([...HEADERS]);
  orders.forEach((o) => {
    ws.addRow([
      formatDdMmYyyy(o.orderDate),
      o.orderNumber,
      o.customerName,
      o.channel,
      o.lineCount,
      Number(o.subtotal.toFixed(2)),
      Number(o.shippingFee.toFixed(2)),
      Number(o.discountAmount.toFixed(2)),
      Number(o.totalAmount.toFixed(2)),
    ]);
  });
  ws.columns = [
    { width: 12 },
    { width: 10 },
    { width: 28 },
    { width: 14 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 10 },
    { width: 18 },
  ];

  const out = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = out;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
