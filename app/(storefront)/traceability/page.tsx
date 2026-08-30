import type { Metadata } from "next";
import { TraceabilityPageClient } from "@/components/storefront/traceability/TraceabilityPageClient";
import { isGfTraceabilityPreview } from "@/lib/green-future-traceability";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title:
    "ตรวจสอบย้อนกลับล็อตเมล็ด | Seed lot traceability | Smile Seed Bank",
  description:
    "เอกสารตรวจสอบย้อนกลับสนับสนุน GACP ตามล็อต — ไม่ใช่ใบรับรอง GACP · Supporting lot traceability documentation for GACP purposes — not a GACP certificate.",
  alternates: { canonical: "/traceability" },
  robots: isGfTraceabilityPreview()
    ? { index: false, follow: false }
    : { index: true, follow: true },
};

export default function TraceabilityPage() {
  return <TraceabilityPageClient />;
}
