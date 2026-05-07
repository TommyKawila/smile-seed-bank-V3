"use client";

import type { BulkSeedDTO } from "@/lib/bulk-seeds/types";
import { labelForTierKey } from "@/lib/bulk-seeds/constants";
import { defaultTierKeysForExport } from "@/lib/bulk-seeds/parse-import";

export async function exportBulkSeedsPdf(opts: {
  rows: BulkSeedDTO[];
  sourceFilterLabel?: string;
}): Promise<void> {
  const { rows, sourceFilterLabel } = opts;
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const tierKeys = defaultTierKeysForExport(rows.map((r) => r.tier_prices));
  const head = [
    "Strain",
    "Code",
    "THC",
    "Cycle",
    "Type",
    "Flavor",
    ...tierKeys.map(labelForTierKey),
  ];
  const body = rows.map((r) => [
    r.strain || "—",
    r.code || "—",
    r.thc || "—",
    r.cycle || "—",
    r.type || "—",
    r.flavor || "—",
    ...tierKeys.map((k) => {
      const v = r.tier_prices[k];
      if (v == null) return "—";
      return typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(v);
    }),
  ]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFillColor(18, 70, 62);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Smile Seed Bank", 14, 12);
  doc.setFontSize(9);
  doc.text(
    sourceFilterLabel
      ? `Wholesale bulk price list — ${sourceFilterLabel}`
      : "Wholesale bulk price list",
    14,
    18
  );
  doc.setTextColor(30, 30, 30);
  const iso = new Date().toISOString().slice(0, 10);
  doc.setFontSize(8);
  doc.text(`Exported ${iso}`, 283, 18, { align: "right" });
  autoTable(doc, {
    head: [head],
    body,
    startY: 26,
    styles: { fontSize: 6.5, cellPadding: 1.2, overflow: "linebreak" },
    headStyles: { fillColor: [18, 70, 62], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });
  doc.save(`smile-seed-bank-bulk-${iso}.pdf`);
}
