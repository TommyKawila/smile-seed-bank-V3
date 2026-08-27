import type { Metadata } from "next";
import { GacpLandingClient } from "@/components/storefront/wholesale/gacp/GacpLandingClient";
import { gfWholesaleRobots } from "@/lib/green-future-approved-marketing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "เมล็ดควบคุมและเอกสารล็อตสำหรับฟาร์มที่มีใบอนุญาต | Controlled seeds & lot documents | Smile Seed Bank",
  description:
    "เมล็ดควบคุมสำหรับฟาร์มที่มีใบอนุญาต พร้อมเอกสาร traceability สนับสนุน GACP — รับคำขอใบเสนอราคาเท่านั้น · Controlled cannabis seeds for licensed farms with supporting traceability documents — quotation requests only.",
  alternates: { canonical: "/wholesale/gacp" },
  robots: gfWholesaleRobots(),
};

export default function GacpWholesalePage() {
  return <GacpLandingClient />;
}
