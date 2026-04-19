import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เงื่อนไขการใช้งาน | Smile Seed Bank",
  description:
    "ข้อกำหนดการใช้บริการร้านเมล็ดพันธุ์ Smile Seed Bank — อายุ ข้อกฎหมาย ความเป็นส่วนตัว และนโยบายคืนสินค้า",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
