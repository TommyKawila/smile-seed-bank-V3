export type BulkShareLang = "th" | "en";

export const BULK_SHARE_LANG_KEY = "ssb-bulk-share-lang";

type Dict = {
  exclusive: string;
  pricePerSeed: string;
  expires: (date: string) => string;
  tapToCart: string;
  qtyCol: string;
  priceCol: string;
  sgImportNote: string;
  sgfFormats: string;
  cart: string;
  remove: string;
  decrease: string;
  increase: string;
  minQty: (n: number) => string;
  seedsPhotoFf: (n: string) => string;
  perSeed: string;
  invalidQty: string;
  confidential: string;
  strainCount: (n: number, seeds: string) => string;
  submitOrder: string;
  sheetTitle: string;
  name: string;
  namePh: string;
  lineId: string;
  linePh: string;
  phone: string;
  phonePh: string;
  note: string;
  notePh: string;
  cancel: string;
  confirm: string;
  errName: string;
  errContact: string;
  errEmpty: string;
  errFail: string;
  thanksEyebrow: string;
  thanksTitle: string;
  thanksBody: string;
  thanksKeep: string;
  sgfStrainsTitle: string;
  sgStrainsTitle: string;
  tapHint: string;
  supremeWhat: string;
  explain: string;
  seedsPerStrain: string;
};

export const BULK_SHARE_COPY: Record<BulkShareLang, Dict> = {
  th: {
    exclusive: "ข้อเสนอพิเศษ",
    pricePerSeed: "Smile Seed Bank · ราคาต่อเมล็ด (THB) ตามปริมาณ · ไม่รวมค่าขนส่งปลายทาง",
    expires: (date) => `ลิงก์หมดอายุ ${date}`,
    tapToCart: "กดชื่อสายเพื่อเพิ่มในตะกร้า",
    qtyCol: "ปริมาณ",
    priceCol: "ราคา / เมล็ด",
    sgImportNote: "ราคารวมบริการนำเข้า — สูงกว่า bulk สาธารณะของ Seeds Genetics เล็กน้อย",
    sgfFormats: "Photo · Auto · Photo FF",
    cart: "ตะกร้า",
    remove: "ลบ",
    decrease: "ลด",
    increase: "เพิ่ม",
    minQty: (n) => `ขั้นต่ำ ${n}`,
    seedsPhotoFf: (n) => `${n} เมล็ด (Photo FF)`,
    perSeed: "/เมล็ด",
    invalidQty: "จำนวนไม่ถูกต้อง",
    confidential: "ลับ · ไม่เผยแพร่สาธารณะ · Smile Seed Bank",
    strainCount: (n, seeds) => `${n} สาย · ${seeds} เมล็ด`,
    submitOrder: "ส่งคำสั่งซื้อ",
    sheetTitle: "ส่งคำสั่งซื้อ",
    name: "ชื่อ *",
    namePh: "ชื่อผู้ติดต่อ",
    lineId: "LINE ID",
    linePh: "@username หรือ LINE ID",
    phone: "โทร",
    phonePh: "08x-xxx-xxxx",
    note: "หมายเหตุ",
    notePh: "ไม่บังคับ",
    cancel: "ยกเลิก",
    confirm: "ยืนยันส่งคำสั่ง",
    errName: "กรุณากรอกชื่อ",
    errContact: "กรุณากรอก LINE ID หรือเบอร์โทร",
    errEmpty: "ตะกร้าว่าง",
    errFail: "ส่งไม่สำเร็จ",
    thanksEyebrow: "ส่งคำสั่งแล้ว",
    thanksTitle: "ขอบคุณครับ",
    thanksBody: "เราได้รับคำสั่งของคุณแล้ว — ทีม Smile Seed Bank จะติดต่อกลับเร็วๆ นี้",
    thanksKeep: "เก็บเลขอ้างอิงนี้ไว้สำหรับติดตาม",
    sgfStrainsTitle: "สายพันธุ์ (SGF Seeds)",
    sgStrainsTitle: "สายพันธุ์ (Seeds Genetics)",
    tapHint: "กดชื่อสายเพื่อเพิ่มในตะกร้า",
    supremeWhat: "Supreme คืออะไร?",
    explain: "อธิบาย",
    seedsPerStrain: "เมล็ด / สาย",
  },
  en: {
    exclusive: "Exclusive offer",
    pricePerSeed:
      "Smile Seed Bank · price per seed (THB) by quantity · destination shipping not included",
    expires: (date) => `Link expires ${date}`,
    tapToCart: "Tap a strain to add to cart",
    qtyCol: "Quantity",
    priceCol: "Price / seed",
    sgImportNote:
      "Import service included — slightly above Seeds Genetics public bulk rates",
    sgfFormats: "Photo · Auto · Photo FF",
    cart: "Cart",
    remove: "Remove",
    decrease: "Decrease",
    increase: "Increase",
    minQty: (n) => `Min ${n}`,
    seedsPhotoFf: (n) => `${n} seeds (Photo FF)`,
    perSeed: "/seed",
    invalidQty: "Invalid quantity",
    confidential: "Confidential · not for public listing · Smile Seed Bank",
    strainCount: (n, seeds) => `${n} strains · ${seeds} seeds`,
    submitOrder: "Submit order",
    sheetTitle: "Submit order",
    name: "Name *",
    namePh: "Contact name",
    lineId: "LINE ID",
    linePh: "@username or LINE ID",
    phone: "Phone",
    phonePh: "Phone number",
    note: "Note",
    notePh: "Optional",
    cancel: "Cancel",
    confirm: "Confirm order",
    errName: "Name is required",
    errContact: "LINE ID or phone is required",
    errEmpty: "Cart is empty",
    errFail: "Could not submit",
    thanksEyebrow: "Order received",
    thanksTitle: "Thank you",
    thanksBody: "We received your order — Smile Seed Bank will contact you shortly",
    thanksKeep: "Keep this reference number for follow-up",
    sgfStrainsTitle: "Strains (SGF Seeds)",
    sgStrainsTitle: "Strains (Seeds Genetics)",
    tapHint: "Tap a strain to add to cart",
    supremeWhat: "What is Supreme?",
    explain: "Explain",
    seedsPerStrain: "seeds / strain",
  },
};

export function localizeQtyDescription(desc: string, lang: BulkShareLang): string {
  if (lang === "en") return desc;
  return desc
    .replace(/seeds\s*\/\s*strain/gi, "เมล็ด / สาย")
    .replace(/\bseeds\b/gi, "เมล็ด");
}
