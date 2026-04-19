import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | Smile Seed Bank",
  description:
    "นโยบายความเป็นส่วนตัวของ Smile Seed Bank — การเก็บข้อมูล การใช้งาน ความปลอดภัย และสิทธิของคุณ",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
