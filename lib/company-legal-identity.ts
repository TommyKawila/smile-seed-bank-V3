/**
 * SSOT — legal entities for letterhead, About Us, and trust footers.
 * Document scan URLs live in site_settings (Admin upload); numbers/addresses live here.
 */

export type LegalLocale = "th" | "en";

/** Entity A — registered partnership (formal letterhead). */
export const LEGAL_ENTITY = {
  nameTh: "ห้างหุ้นส่วนจำกัด ทีเอ็มวาย อะโกร เทรด",
  nameEn: "T.M.Y Agro Trade Limited Partnership",
  addressTh: "161 หมู่ 16 ตำบลแม่สาว อำเภอแม่อาย จังหวัดเชียงใหม่ 50280",
  addressEn: "161 Moo 16, Mae Sao, Mae Ai, Chiang Mai, Thailand, 50280",
  seedLicenseNumber: "1011043900042568",
} as const;

/** Entity B — online store brand (Smile Seed Bank). */
export const STORE_ENTITY = {
  nameTh: "ร้านค้าออนไลน์ Smile Seed Bank",
  nameEn: "Smile Seed Bank Online Store",
  brandName: "Smile Seed Bank",
  websiteDisplay: "www.smileseedbank.com",
  websiteUrl: "https://www.smileseedbank.com",
  commercialRegistrationNumber: "1500900026221",
  seedLicenseNumber: "1011043900132566",
} as const;

export type LocalizedLegalEntity = {
  name: string;
  address: string;
  seedLicenseNumber: string;
  seedLicenseLabel: string;
};

export type LocalizedStoreEntity = {
  name: string;
  brandName: string;
  websiteDisplay: string;
  websiteUrl: string;
  commercialRegistrationNumber: string;
  commercialRegistrationLabel: string;
  seedLicenseNumber: string;
  seedLicenseLabel: string;
};

export function getLegalEntity(locale: LegalLocale): LocalizedLegalEntity {
  const th = locale === "th";
  return {
    name: th ? LEGAL_ENTITY.nameTh : LEGAL_ENTITY.nameEn,
    address: th ? LEGAL_ENTITY.addressTh : LEGAL_ENTITY.addressEn,
    seedLicenseNumber: LEGAL_ENTITY.seedLicenseNumber,
    seedLicenseLabel: th
      ? "ใบอนุญาตขายเมล็ดพันธุ์ควบคุมเลขที่"
      : "Controlled seed sales license number",
  };
}

export function getStoreEntity(locale: LegalLocale): LocalizedStoreEntity {
  const th = locale === "th";
  return {
    name: th ? STORE_ENTITY.nameTh : STORE_ENTITY.nameEn,
    brandName: STORE_ENTITY.brandName,
    websiteDisplay: STORE_ENTITY.websiteDisplay,
    websiteUrl: STORE_ENTITY.websiteUrl,
    commercialRegistrationNumber: STORE_ENTITY.commercialRegistrationNumber,
    commercialRegistrationLabel: th ? "ทะเบียนพาณิชย์เลขที่" : "Commercial registration number",
    seedLicenseNumber: STORE_ENTITY.seedLicenseNumber,
    seedLicenseLabel: th
      ? "ใบอนุญาตขายเมล็ดพันธุ์ควบคุมเลขที่"
      : "Controlled seed sales license number",
  };
}

/** Letterhead lines — legal entity + operating brand (EN default for international docs). */
export function formatLetterheadBlock(locale: LegalLocale = "en"): string[] {
  const legal = getLegalEntity(locale);
  const store = getStoreEntity(locale);
  return [
    legal.name,
    legal.address,
    `${legal.seedLicenseLabel} : ${legal.seedLicenseNumber}`,
    locale === "th"
      ? `ดำเนินการภายใต้แบรนด์ ${store.brandName}`
      : `Operating as ${store.brandName}`,
  ];
}

/** Store trust / footer lines for docs and About. */
export function formatStoreTrustBlock(locale: LegalLocale = "en"): string[] {
  const store = getStoreEntity(locale);
  return [
    store.name,
    store.websiteDisplay,
    `${store.commercialRegistrationLabel} : ${store.commercialRegistrationNumber}`,
    `${store.seedLicenseLabel} : ${store.seedLicenseNumber}`,
  ];
}

/** Prefer Admin override when set; else SSOT. */
export function resolveStoreSeedLicenseNumber(override?: string | null): string {
  const v = override?.trim();
  return v || STORE_ENTITY.seedLicenseNumber;
}

export function resolveStoreCommercialRegistrationNumber(override?: string | null): string {
  const v = override?.trim();
  return v || STORE_ENTITY.commercialRegistrationNumber;
}

export function resolveCompanySeedLicenseNumber(override?: string | null): string {
  const v = override?.trim();
  return v || LEGAL_ENTITY.seedLicenseNumber;
}
