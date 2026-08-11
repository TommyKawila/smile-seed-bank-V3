/**
 * SSOT — storefront legal disclaimer (footer, terms, privacy).
 * Adapted for Smile Seed Bank / Thailand context.
 */

import type { LegalLocale } from "@/lib/company-legal-identity";

export const STOREFRONT_LEGAL_DISCLAIMER = {
  titleTh: "ข้อจำกัดความรับผิดชอบ",
  titleEn: "Disclaimer",
  bodyTh:
    "เมล็ดพันธุ์กัญชาจำหน่ายเพื่อเป็นของที่ระลึกและของสะสมเท่านั้น ไม่มี THC ที่ใช้งานได้ในรูปแบบเมล็ด คุณมีหน้าที่ตรวจสอบกฎหมายท้องถิ่น ระดับจังหวัด และระดับชาติที่ใช้บังคับก่อนสั่งซื้อ และ Smile Seed Bank ไม่รับผิดชอบต่อการนำเมล็ดไปใช้หลังได้รับสินค้า ข้อความบนเว็บไซต์และเกี่ยวกับสินค้าของเรายังไม่ได้รับการประเมินจาก อย. (สำนักงานคณะกรรมการอาหารและยา) สินค้าของเราไม่ได้มีวัตถุประสงค์เพื่อวินิจฉัย รักษา บรรเทา หรือป้องกันโรคใด ๆ โปรดปรึกษาแพทย์หรือผู้เชี่ยวชาญด้านสุขภาพก่อนใช้ เมื่อสินค้าอยู่ในความครอบครองของคุณแล้ว Smile Seed Bank ไม่รับผิดชอบทางกฎหมายต่อการกระทำของคุณ และไม่รับผิดชอบต่อปัญหาทางกฎหมายหรือปัญหาอื่นใดที่อาจเกิดขึ้น",
  bodyEn:
    "Cannabis seeds are sold as souvenirs and collectibles only. They contain no usable THC in seed form. You must verify all applicable local, provincial, and national laws before ordering, and Smile Seed Bank is not liable for your use of seeds after delivery. Statements on this website and about our products have not been evaluated by the Thai Food and Drug Administration (FDA Thailand). Our products are not intended to diagnose, treat, cure, or prevent any disease. Consult a qualified healthcare professional before use. Once products are in your possession, Smile Seed Bank assumes no legal responsibility for your actions and is not liable for any legal or other issues that may arise.",
} as const;

export function getStorefrontLegalDisclaimer(locale: LegalLocale): {
  title: string;
  body: string;
} {
  const th = locale === "th";
  return {
    title: th ? STOREFRONT_LEGAL_DISCLAIMER.titleTh : STOREFRONT_LEGAL_DISCLAIMER.titleEn,
    body: th ? STOREFRONT_LEGAL_DISCLAIMER.bodyTh : STOREFRONT_LEGAL_DISCLAIMER.bodyEn,
  };
}
