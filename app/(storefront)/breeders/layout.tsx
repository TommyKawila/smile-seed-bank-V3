import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Breeders — Smile Seed Bank",
  description: "แบรนด์และผู้ผลิตเมล็ดพันธุ์ที่ Smile Seed Bank คัดสรร",
  alternates: {
    canonical: "/breeders",
  },
};

export default function BreedersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
