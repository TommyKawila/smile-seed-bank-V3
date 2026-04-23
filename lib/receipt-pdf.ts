import { jsPDF } from "jspdf";
import { parsePackCountFromUnitLabel } from "./cart-pack-display";
import { getImageDimensionsFromDataUrl } from "./image-data-url-dimensions";
import { defaultQuotationShippingFee } from "./order-financials";
import { PROMPT_FONT_BASE64 } from "./prompt-font-base64";
import { formatPhoneNumber } from "./utils";

export type ReceiptItem = {
  productName: string;
  breeder?: string | null;
  unitLabel?: string | null;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
};

export type SocialLink = { platform: string; handle: string };

export type ReceiptPDFOptions = {
  docType: "quotation" | "receipt";
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerNote?: string | null;
  items: ReceiptItem[];
  grandTotal: number;
  logoDataUrl?: string | null;
  validityDate?: string | null;
  companyName?: string;
  companyAddress?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyLineId?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNo?: string | null;
  socialLinks?: SocialLink[];
  legalSeedLicenseNumber?: string | null;
  legalBusinessRegistrationNumber?: string | null;
  attachLegalDocuments?: boolean;
  /** Optional footer line(s); no default shipping boilerplate — use for legal/disclaimer only */
  notes?: string | null;
  /** Quotation/manual override: shipping row. Receipt: prefer `orderFinancials`. */
  shippingCost?: number | null;
  itemsSubtotal?: number | null;
  /** Receipt: from `orders.shipping_fee` & `orders.discount_amount` when generating from an order */
  orderFinancials?: { shippingFee: number; discountAmount: number } | null;
  /**
   * When `orderFinancials` is omitted but `shippingCost` is set — gross items subtotal =
   * `grandTotal - shippingCost + receiptOrderDiscount`.
   */
  receiptOrderDiscount?: number | null;
  paymentDate?: string | null;
  paymentMethod?: string | null;
};

export const RECEIPT_ELIGIBLE_STATUSES = [
  "PAID",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
] as const;

export { isReceiptEligibleStatus } from "./order-paid";

/** Split order-level discount across lines by line total (for receipt transparency). */
export function allocateOrderDiscountToLines(lineTotals: number[], orderDiscount: number): number[] {
  const n = lineTotals.length;
  if (n === 0 || orderDiscount <= 0) return lineTotals.map(() => 0);
  const sum = lineTotals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return lineTotals.map(() => 0);
  const shares: number[] = [];
  let allocated = 0;
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      shares.push(Math.round((orderDiscount - allocated) * 100) / 100);
    } else {
      const v = Math.round(((orderDiscount * lineTotals[i]) / sum) * 100) / 100;
      shares.push(v);
      allocated += v;
    }
  }
  return shares;
}

function formatBahtPdf(amount: number): string {
  const n = Math.round(amount * 100) / 100;
  const opts: Intl.NumberFormatOptions =
    Number.isInteger(n) ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `฿${n.toLocaleString("th-TH", opts)}`;
}

function itemTitleLine(productName: string | null | undefined, breeder: string | null | undefined): string {
  const name = (productName ?? "").toString().trim() || "—";
  const b = (breeder ?? "").toString().trim();
  return b ? `${name} by ${b}` : name;
}

function packCellLines(unitLabel: string | null | undefined): { th: string; en: string } {
  const raw = (unitLabel ?? "").toString();
  const n = parsePackCountFromUnitLabel(raw);
  if (n > 0) {
    return {
      th: `แพ็ค ${n} เมล็ด`,
      en: `${n} seeds pack`,
    };
  }
  const u = raw.trim();
  return { th: u || "—", en: u || "—" };
}

export function formatPaymentMethodForPdf(m: string | null | undefined): string | null {
  if (!m) return null;
  const map: Record<string, string> = {
    CASH: "เงินสด / Cash",
    BANK_TRANSFER: "โอนธนาคาร / Bank Transfer",
    TRANSFER: "โอนเงิน / Bank Transfer",
    PROMPT_PAY: "พร้อมเพย์ / PromptPay",
    COD: "เก็บเงินปลายทาง / COD",
    CREDIT_CARD: "บัตรเครดิต / Credit Card",
  };
  return map[m] ?? m;
}

function registerThaiFont(doc: jsPDF) {
  doc.addFileToVFS("Prompt-Regular.ttf", PROMPT_FONT_BASE64);
  doc.addFont("Prompt-Regular.ttf", "Prompt", "normal");
  doc.setFont("Prompt", "normal");
}

const MARGIN = 15;
/** Column boundaries (mm): No | Item | Pack | Qty | Unit | Total — no per-line discount column */
const COL_X = [15, 25, 95, 115, 133, 158, 195];
const CELL_PAD = 2;
const LOGO_W = 40;
const LOGO_H_FALLBACK = 40 * (18 / 50);

function fallbackStr(val: string | null | undefined, def: string): string {
  const s = (val ?? "").toString().trim();
  return s || def;
}

function formatCustomerName(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function generateReceiptPDF(opts: ReceiptPDFOptions): jsPDF {
  const {
    docType,
    orderNumber,
    orderDate,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerNote,
    items,
    grandTotal,
    logoDataUrl,
    validityDate,
    companyName = "Smile Seed Bank",
    companyAddress,
    companyEmail,
    companyPhone,
    companyLineId,
    bankName,
    bankAccountName,
    bankAccountNo,
    socialLinks = [],
    legalSeedLicenseNumber,
    legalBusinessRegistrationNumber,
    attachLegalDocuments,
    notes,
    shippingCost: shippingCostOpt,
    itemsSubtotal: itemsSubtotalOpt,
    orderFinancials,
    receiptOrderDiscount,
    paymentDate,
    paymentMethod,
  } = opts;

  const isReceipt = docType === "receipt";
  const theme = isReceipt ? { main: [0, 51, 102], dark: [0, 40, 80] } : { main: [5, 120, 80], dark: [5, 100, 65] };
  const setThemeColor = (which: "main" | "dark") => {
    const [r, g, b] = theme[which];
    doc.setTextColor(r, g, b);
  };
  const setThemeFill = (which: "main" | "dark") => {
    const [r, g, b] = theme[which];
    doc.setFillColor(r, g, b);
  };
  const setThemeDraw = () => {
    const [r, g, b] = theme.main;
    doc.setDrawColor(r, g, b);
  };

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerThaiFont(doc);

  const w = 210;
  const rightEdge = w - MARGIN;
  let y = MARGIN;

  const ordNum = fallbackStr(orderNumber, "N/A");
  const ordDate = fallbackStr(orderDate, "—");
  const cust = formatCustomerName(fallbackStr(customerName, "General Customer"));

  let logoDrawH = LOGO_H_FALLBACK;
  if (logoDataUrl) {
    try {
      const finalLogoBase64 = logoDataUrl.startsWith("data:image/png;base64,")
        ? logoDataUrl
        : logoDataUrl.startsWith("data:image/")
          ? logoDataUrl
          : `data:image/png;base64,${logoDataUrl}`;
      const fmt =
        finalLogoBase64.startsWith("data:image/jpeg") || finalLogoBase64.startsWith("data:image/jpg")
          ? "JPEG"
          : "PNG";
      const dim = getImageDimensionsFromDataUrl(finalLogoBase64);
      logoDrawH =
        dim && dim.width > 0 ? (LOGO_W * dim.height) / dim.width : LOGO_H_FALLBACK;
      doc.addImage(finalLogoBase64, fmt, MARGIN, y, LOGO_W, logoDrawH, "LOGO", "FAST");
    } catch {
      doc.setFontSize(12);
      setThemeColor("main");
      doc.text(companyName, MARGIN, y + 8);
      logoDrawH = 10;
    }
  } else {
    doc.setFontSize(12);
    setThemeColor("main");
    doc.text(companyName, MARGIN, y + 8);
  }

  doc.setFontSize(10);
  setThemeColor("main");
  const titleThai = docType === "quotation" ? "ใบเสนอราคา" : "ใบเสร็จรับเงิน";
  const titleEn = docType === "quotation" ? "Quotation" : "Receipt";
  doc.text(`${titleThai} / ${titleEn}`, rightEdge, y + 6, { align: "right" });
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  const ordLabel = isReceipt ? "Receipt No." : "Order";
  doc.text(`${ordLabel}: ${ordNum}  |  Date: ${ordDate}`, rightEdge, y + 10, { align: "right" });
  let headerLineY = 14;
  if (docType === "quotation" && validityDate) {
    doc.text(`Valid Until: ${validityDate}`, rightEdge, y + headerLineY, { align: "right" });
  } else if (isReceipt) {
    const payDate = fallbackStr(paymentDate, ordDate);
    doc.text(`วันที่ชำระเงิน / Payment Date: ${payDate}`, rightEdge, y + headerLineY, { align: "right" });
    if (paymentMethod) {
      headerLineY += 4;
      doc.text(`ช่องทางการชำระเงิน / Payment Method: ${paymentMethod}`, rightEdge, y + headerLineY, { align: "right" });
    }
  }
  y += Math.max(logoDataUrl ? logoDrawH : LOGO_H_FALLBACK, headerLineY + 4);

  const lineH = 5;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`ลูกค้า / Customer: ${cust}`, MARGIN, y);
  y += lineH;

  const custPhone = fallbackStr(customerPhone, "").trim();
  if (custPhone) {
    doc.text(`เบอร์โทร / Phone: ${formatPhoneNumber(custPhone)}`, MARGIN, y);
    y += lineH;
  }
  const custEmail = fallbackStr(customerEmail, "").trim();
  if (custEmail) {
    doc.text(`อีเมล / Email: ${custEmail}`, MARGIN, y);
    y += lineH;
  }
  const custAddr = fallbackStr(customerAddress, "").trim();
  if (custAddr) {
    doc.setFontSize(9);
    doc.text("ที่อยู่จัดส่ง / Shipping Address:", MARGIN, y);
    y += lineH;
    const shipNameRaw = fallbackStr(customerName, "").trim();
    if (shipNameRaw) {
      doc.text(formatCustomerName(shipNameRaw).toUpperCase(), MARGIN, y);
      y += lineH;
    }
    if (custPhone) {
      doc.text(`Phone: ${formatPhoneNumber(custPhone)}`, MARGIN, y);
      y += lineH;
    }
    const addrLines = doc.splitTextToSize(custAddr, rightEdge - MARGIN);
    for (const line of addrLines) {
      doc.text(line, MARGIN, y);
      y += lineH;
    }
  }
  const custNote = fallbackStr(customerNote, "").trim();
  if (custNote) {
    doc.setFontSize(9);
    doc.text("หมายเหตุ / Notes:", MARGIN, y);
    y += lineH;
    const noteLines = doc.splitTextToSize(custNote, rightEdge - MARGIN);
    for (const line of noteLines) {
      doc.text(line, MARGIN, y);
      y += lineH;
    }
  }

  y += 10;

  setThemeDraw();
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, rightEdge, y);
  y += 8;

  const headerRowH = 12;
  const dataRowH = 16;
  const rowPadTop = 5;
  const tableTop = y;

  setThemeFill("dark");
  doc.rect(MARGIN, tableTop, rightEdge - MARGIN, headerRowH, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const headerCells = [
    { th: "ลำดับ", en: "No.", col: 0, align: "center" as const },
    { th: "รายการ", en: "Item", col: 1, align: "left" as const },
    { th: "แพ็ก", en: "Pack", col: 2, align: "center" as const },
    { th: "จำนวน", en: "Qty", col: 3, align: "center" as const },
    { th: "ราคา/หน่วย", en: "Unit Price", col: 4, align: "right" as const },
    { th: "รวม", en: "Total", col: 5, align: "right" as const },
  ];
  const thY = y + 4;
  const enY = y + 4 + 3 + 2;
  for (const h of headerCells) {
    const left = COL_X[h.col] + CELL_PAD;
    const right = COL_X[h.col + 1] - CELL_PAD;
    const mid = (left + right) / 2;
    if (h.align === "left") {
      doc.text(h.th, left, thY);
      doc.setFontSize(6);
      doc.setTextColor(220, 220, 220);
      doc.text(h.en, left, enY);
    } else if (h.align === "center") {
      doc.text(h.th, mid, thY, { align: "center" });
      doc.setFontSize(6);
      doc.setTextColor(220, 220, 220);
      doc.text(h.en, mid, enY, { align: "center" });
    } else {
      doc.text(h.th, right, thY, { align: "right" });
      doc.setFontSize(6);
      doc.setTextColor(220, 220, 220);
      doc.text(h.en, right, enY, { align: "right" });
    }
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
  }
  y += headerRowH;
  y += 2;

  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.25);
  let tableBottom = y;
  const itemColW = Math.max(20, COL_X[2] - COL_X[1] - CELL_PAD * 2 - 3);
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (y > 248) {
      doc.addPage();
      registerThaiFont(doc);
      y = MARGIN;
    }
    y += rowPadTop;
    const textY = y;
    doc.setFont("Prompt", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(String(idx + 1), (COL_X[0] + COL_X[1]) / 2, textY, { align: "center" });
    const itemLabel = itemTitleLine(item.productName, item.breeder);
    const lines = doc.splitTextToSize(itemLabel, itemColW);
    for (let i = 0; i < Math.min(lines.length, 2); i++) {
      doc.text(lines[i], COL_X[1] + CELL_PAD, textY + i * 4);
    }
    const pack = packCellLines(item.unitLabel);
    const packMidX = (COL_X[2] + COL_X[3]) / 2;
    doc.setFontSize(6.5);
    doc.setTextColor(72, 72, 72);
    doc.text(pack.th, packMidX, textY, { align: "center" });
    doc.text(pack.en, packMidX, textY + 3.4, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(String(item.quantity), (COL_X[3] + COL_X[4]) / 2, textY, { align: "center" });
    doc.text(formatBahtPdf(item.price), COL_X[5] - CELL_PAD, textY, { align: "right" });
    const lineGross = item.subtotal;
    doc.text(formatBahtPdf(lineGross), COL_X[6] - CELL_PAD, textY, { align: "right" });
    y += dataRowH - rowPadTop;
    tableBottom = y;
  }

  doc.rect(MARGIN, tableTop, rightEdge - MARGIN, tableBottom - tableTop, "S");
  doc.line(MARGIN, tableTop + headerRowH, rightEdge, tableTop + headerRowH);
  for (let i = 1; i < COL_X.length; i++) {
    doc.line(COL_X[i], tableTop, COL_X[i], tableBottom);
  }
  y = tableBottom + 10;

  let lineSubtotal = grandTotal;
  let shippingCost = 0;
  let discountAmount = 0;

  if (isReceipt && orderFinancials != null) {
    shippingCost = Math.max(0, Number(orderFinancials.shippingFee) || 0);
    discountAmount = Math.max(0, Number(orderFinancials.discountAmount) || 0);
    lineSubtotal = grandTotal - shippingCost + discountAmount;
  } else if (shippingCostOpt !== undefined && shippingCostOpt !== null) {
    shippingCost = Math.max(0, Number(shippingCostOpt) || 0);
    discountAmount = Math.max(0, Number(receiptOrderDiscount) || 0);
    if (itemsSubtotalOpt !== undefined && itemsSubtotalOpt !== null) {
      lineSubtotal = Math.max(0, Number(itemsSubtotalOpt) || 0);
    } else {
      lineSubtotal = Math.max(0, grandTotal - shippingCost + discountAmount);
    }
  } else if (docType === "quotation") {
    lineSubtotal = grandTotal;
    shippingCost = defaultQuotationShippingFee(lineSubtotal);
  }
  const netTotal = lineSubtotal + shippingCost - discountAmount;

  const sumX = rightEdge - CELL_PAD;
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const useOrderFin = isReceipt && orderFinancials != null;
  const legacyReceiptFin =
    isReceipt &&
    orderFinancials == null &&
    shippingCostOpt !== undefined &&
    shippingCostOpt !== null &&
    (shippingCost > 0 || discountAmount > 0);
  const receiptBreakdown = useOrderFin || legacyReceiptFin;
  const subtotalLabel =
    useOrderFin || (isReceipt && receiptBreakdown)
      ? "ยอดรวมสินค้า / Items Subtotal:"
      : "ยอดรวม / Subtotal:";
  doc.text(`${subtotalLabel} ${formatBahtPdf(lineSubtotal)}`, sumX, y, { align: "right" });
  y += 5;
  if (receiptBreakdown && discountAmount > 0.005) {
    doc.setFont("Prompt", "normal");
    doc.setTextColor(160, 45, 45);
    doc.setFontSize(9.5);
    doc.text(`ส่วนลด / Discount: -${formatBahtPdf(discountAmount)}`, sumX, y, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    y += 5;
  }
  const showLegacyReceiptShipping =
    docType === "receipt" &&
    !useOrderFin &&
    shippingCostOpt !== undefined &&
    shippingCostOpt !== null;
  if (docType === "quotation" || showLegacyReceiptShipping) {
    if (shippingCost === 0) {
      setThemeColor("main");
      doc.text("ค่าจัดส่ง / Shipping: ฟรี / Free", sumX, y, { align: "right" });
    } else {
      doc.text(`ค่าจัดส่ง / Shipping: ${formatBahtPdf(shippingCost)}`, sumX, y, { align: "right" });
    }
    doc.setTextColor(60, 60, 60);
    y += 8;
  } else if (receiptBreakdown && shippingCost > 0) {
    doc.text(`ค่าจัดส่ง / Shipping: ${formatBahtPdf(shippingCost)}`, sumX, y, { align: "right" });
    y += 8;
  }

  const tableRight = COL_X[6];
  const netBarWidth = tableRight - MARGIN;
  setThemeDraw();
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, tableRight, y);
  doc.line(MARGIN, y + 8, tableRight, y + 8);
  setThemeFill("main");
  doc.rect(MARGIN, y, netBarWidth, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Prompt", "normal");
  doc.text(`ยอดรวมสุทธิ / Net Grand Total: ${formatBahtPdf(netTotal)}`, tableRight - CELL_PAD, y + 5.5, { align: "right" });
  doc.setFontSize(9);
  y += 14;
  if (isReceipt) {
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("ได้รับเงินถูกต้องเรียบร้อยแล้ว / Payment Received", tableRight - CELL_PAD, y, { align: "right" });
    y += 5;
  }

  if (bankName || bankAccountName || bankAccountNo) {
    doc.setFontSize(9);
    setThemeColor("main");
    doc.text("ข้อมูลการชำระเงิน / Payment Information", MARGIN, y);
    y += 6;
    doc.setTextColor(60, 60, 60);
    doc.setFont("Prompt", "normal");
    if (bankName) {
      doc.text("ธนาคาร / Bank: ", MARGIN, y);
      doc.setFont("Helvetica", "bold");
      doc.text(bankName, MARGIN + doc.getTextWidth("ธนาคาร / Bank: "), y);
      doc.setFont("Prompt", "normal");
      y += 5;
    }
    if (bankAccountName) {
      doc.text("ชื่อบัญชี / Account Name: ", MARGIN, y);
      doc.setFont("Helvetica", "bold");
      doc.text(bankAccountName, MARGIN + doc.getTextWidth("ชื่อบัญชี / Account Name: "), y);
      doc.setFont("Prompt", "normal");
      y += 5;
    }
    if (bankAccountNo) {
      doc.text("เลขที่บัญชี / Account Number: ", MARGIN, y);
      doc.setFont("Helvetica", "bold");
      doc.text(bankAccountNo, MARGIN + doc.getTextWidth("เลขที่บัญชี / Account Number: "), y);
      doc.setFont("Prompt", "normal");
      y += 8;
    }
  }

  const footerExtra = (notes ?? "").trim();
  if (footerExtra) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const wrapped = doc.splitTextToSize(`หมายเหตุ: ${footerExtra}`, rightEdge - MARGIN);
    for (const line of wrapped) {
      doc.text(line, MARGIN, y);
      y += 4;
    }
    y += 4;
  }

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  let fy = y + 6;
  const rowGap = 5;

  const row1Parts: string[] = [];
  if (companyPhone) row1Parts.push(`โทร / Tel: ${formatPhoneNumber(companyPhone)}`);
  if (companyEmail) row1Parts.push(`อีเมล / Email: ${companyEmail}`);
  if (row1Parts.length > 0) {
    doc.text(row1Parts.join("  |  "), MARGIN, fy);
    fy += rowGap;
  }

  const lineHandle = companyLineId ?? socialLinks.find((s) => s.platform === "Line")?.handle;
  const row2Parts: string[] = ["เว็บไซต์ / Web: smileseedbank.com"];
  if (lineHandle) {
    const display = lineHandle.startsWith("@") ? lineHandle : `@${lineHandle}`;
    row2Parts.push(`ไลน์ / Line: ${display}`);
  }
  doc.text(row2Parts.join("  |  "), MARGIN, fy);
  fy += rowGap;

  if (attachLegalDocuments && (legalSeedLicenseNumber || legalBusinessRegistrationNumber)) {
    fy += 2;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const legalParts: string[] = [];
    if (legalSeedLicenseNumber) legalParts.push(`ใบอนุญาตเมล็ดพันธุ์: ${legalSeedLicenseNumber}`);
    if (legalBusinessRegistrationNumber) legalParts.push(`ทะเบียนพาณิชย์: ${legalBusinessRegistrationNumber}`);
    doc.text(legalParts.join("  |  "), w / 2, Math.min(fy, 290), { align: "center" });
  }

  return doc;
}
