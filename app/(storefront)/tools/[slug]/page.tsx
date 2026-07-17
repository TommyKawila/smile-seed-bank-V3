import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TOOL_LABELS: Record<string, { th: string; en: string }> = {
  "soil-mixer": { th: "ผสมดิน", en: "Soil Mixer" },
  "vpd-calculator": { th: "คำนวณ VPD", en: "VPD Calculator" },
  fertilizer: { th: "ปุ๋ย", en: "Fertilizer" },
  "plant-doctor": { th: "หมอพืช", en: "Plant Doctor" },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const label = TOOL_LABELS[slug]?.en ?? "Grow Tool";
  return { title: `${label} | Smile Seed Bank`, robots: { index: false } };
}

export default async function ToolStubPage({ params }: Props) {
  const { slug } = await params;
  const meta = TOOL_LABELS[slug];
  const title = meta?.th ?? slug;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="surface-glass rounded-xl p-8 text-center">
        <h1 className="text-h1-cyber text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          เครื่องมือนี้กำลังพัฒนา — เร็วๆ นี้
        </p>
        <Button asChild className="mt-6 min-h-12 rounded-lg">
          <Link href="/">กลับหน้าแรก</Link>
        </Button>
      </div>
    </div>
  );
}
