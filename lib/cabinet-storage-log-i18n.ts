export type StorageLogLang = "th" | "en";

export const STORAGE_LOG_LANG_KEY = "ssb-storage-log-lang";

type Dict = {
  title: string;
  subtitle: string;
  specTitle: string;
  specTemp: string;
  specRh: string;
  latest: string;
  noEntries: string;
  inSpec: string;
  outOfSpec: string;
  temp: string;
  rh: string;
  loggedAt: string;
  history: string;
  note: string;
  th: string;
  en: string;
  partnerNote: string;
};

const TH: Dict = {
  title: "บันทึกอุณหภูมิ / ความชื้น ตู้เก็บเมล็ด",
  subtitle: "Smile Seed Bank · ตู้เก็บเมล็ดพันธุ์ควบคุม · อัปเดตรายวัน",
  specTitle: "เกณฑ์ที่ใช้",
  specTemp: "อุณหภูมิ +5 ถึง +10°C",
  specRh: "ความชื้นไม่เกิน 50% RH",
  latest: "การอ่านล่าสุด",
  noEntries: "ยังไม่มีบันทึกในช่วง 30 วัน",
  inSpec: "อยู่ในเกณฑ์",
  outOfSpec: "นอกเกณฑ์",
  temp: "อุณหภูมิ",
  rh: "ความชื้น",
  loggedAt: "บันทึกเมื่อ",
  history: "ประวัติ 30 วัน",
  note: "หมายเหตุ",
  th: "ไทย",
  en: "EN",
  partnerNote:
    "ลิงก์นี้สำหรับ Green Future ตรวจสอบบันทึกตู้เก็บเมล็ด — ไม่ต้องเข้าสู่ระบบ",
};

const EN: Dict = {
  title: "Seed storage temperature & humidity log",
  subtitle: "Smile Seed Bank · controlled seed cabinet · daily readings",
  specTitle: "Operating limits",
  specTemp: "Temperature +5 to +10°C",
  specRh: "Relative humidity not exceeding 50% RH",
  latest: "Latest reading",
  noEntries: "No entries in the last 30 days",
  inSpec: "In spec",
  outOfSpec: "Out of spec",
  temp: "Temperature",
  rh: "Humidity",
  loggedAt: "Logged at",
  history: "30-day history",
  note: "Note",
  th: "TH",
  en: "EN",
  partnerNote:
    "This link is for Green Future to review Smile’s seed cabinet log — no login required",
};

export function storageLogT(lang: StorageLogLang): Dict {
  return lang === "th" ? TH : EN;
}

export function formatStorageLogWhen(iso: string, lang: StorageLogLang): string {
  return new Date(iso).toLocaleString(lang === "th" ? "th-TH" : "en-GB", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
