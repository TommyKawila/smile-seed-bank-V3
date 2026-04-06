import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop — Smile Seed Bank",
  description:
    "เลือกซื้อเมล็ดพันธุ์กัญชาคุณภาพจาก Breeder ชั้นนำ — Smile Seed Bank",
  alternates: {
    canonical: "/shop",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
