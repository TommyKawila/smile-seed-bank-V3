/** First test order line list for GF quotation — Ref. GF/SSB/2026-0803 */

export const GREEN_FUTURE_TEST_ORDER_SUBJECT =
  "First Test Order — Line List for Quotation (Ref. GF/SSB/2026-0803 / GF/SSB/2026-0821)";

export type GreenFutureTestOrderLine = {
  varietyCode: string;
  commercialName: string;
  seeds: number;
  packFormat: string;
  coaRequested: string;
  notes: string;
};

export const GREEN_FUTURE_TEST_ORDER_LINES: GreenFutureTestOrderLine[] = [
  {
    varietyCode: "AF99",
    commercialName: "BUBBA KUSH AUTO",
    seeds: 200,
    packFormat: "Bulk (200 seeds/strain) — or 4×50 sealed pouches if GF can pack at source",
    coaRequested: "No (Option A — ship 3–7 days after 50% advance)",
    notes: "ISTA in progress; results expected ~10 Sep 2026",
  },
  {
    varietyCode: "AF143",
    commercialName: "DO-SI-DOS AUTO",
    seeds: 200,
    packFormat: "Bulk (200 seeds/strain) — or 4×50 sealed pouches if GF can pack at source",
    coaRequested: "No (Option A)",
    notes: "ISTA in progress",
  },
  {
    varietyCode: "AF02",
    commercialName: "NORTHERN LIGHTS AUTO",
    seeds: 200,
    packFormat: "Bulk (200 seeds/strain) — or 4×50 sealed pouches if GF can pack at source",
    coaRequested: "No (Option A)",
    notes: "ISTA in progress",
  },
  {
    varietyCode: "AF22",
    commercialName: "PINEAPPLE EXPRESS AUTO",
    seeds: 200,
    packFormat: "Bulk (200 seeds/strain) — or 4×50 sealed pouches if GF can pack at source",
    coaRequested: "No (Option A)",
    notes: "ISTA in progress",
  },
  {
    varietyCode: "AF102",
    commercialName: "CRITICAL 2.0 AUTO",
    seeds: 200,
    packFormat: "Bulk (200 seeds/strain) — or 4×50 sealed pouches if GF can pack at source",
    coaRequested: "No (Option A)",
    notes: "5th strain for SSB Test Order tier — confirm availability; substitute if needed",
  },
];

export const GREEN_FUTURE_TEST_ORDER_TIER = {
  refCode: "GF/SSB/2026-0803",
  tierLabel: "Smile Seed Bank Test Order",
  qtyDescription: "5 strains × 200 seeds (1,000 seeds total)",
  eurPerSeed: "1.15",
  thbPerSeed: "44.21",
  advancePct: 50,
  leadWithoutCoaDays: "3–7 business days after 50% advance",
  leadWithCoaDays: "~30 days lab + 3–7 days ship",
};

function buildTestOrderTable(): string {
  const header =
    "| Variety Code | Commercial Name | Seeds | Pack format | COA | Notes |\n| --- | --- | ---: | --- | --- | --- |";
  const rows = GREEN_FUTURE_TEST_ORDER_LINES.map(
    (l) =>
      `| ${l.varietyCode} | ${l.commercialName} | ${l.seeds} | ${l.packFormat} | ${l.coaRequested} | ${l.notes} |`
  );
  return [header, ...rows].join("\n");
}

export const GREEN_FUTURE_TEST_ORDER_RAW = `Subject: First Test Order — Line List for Quotation (Ref. GF/SSB/2026-0803 / GF/SSB/2026-0821)

Green Future × Smile Seed Bank
First test order — line list for quotation

Reference tier: ${GREEN_FUTURE_TEST_ORDER_TIER.tierLabel} (${GREEN_FUTURE_TEST_ORDER_TIER.refCode})
Quantity: ${GREEN_FUTURE_TEST_ORDER_TIER.qtyDescription}
Indicative unit price: €${GREEN_FUTURE_TEST_ORDER_TIER.eurPerSeed} / ${GREEN_FUTURE_TEST_ORDER_TIER.thbPerSeed} THB per seed (subject to your quotation)
Payment: ${GREEN_FUTURE_TEST_ORDER_TIER.advancePct}% advance; balance due point to be stated in quotation
Lead time (Option A — no COA): ${GREEN_FUTURE_TEST_ORDER_TIER.leadWithoutCoaDays}

---

Line items (Option A — recommended for first test order)

${buildTestOrderTable()}

---

Commercial summary (indicative — confirm in quotation)

| Item | Value |
| --- | --- |
| Total seeds | 1,000 |
| Strains | 5 |
| Indicative seed cost | €1,150 / ~44,210 THB |
| Indicative 50% advance | ~€575 / ~22,105 THB |
| COA add-on (if switched to Option B) | Package A ~USD 250/strain; Package B ~USD 500/strain |
| Quality acceptance | Germination ≥80%, Purity ≥99% (per PO) |
| Delivery address | T.M.Y Agro Trade LP premises on Por.Por. 4 — confirm in PO |
| Label | Legal-first label per meeting agreement — no print before mutual written approval |

Option B (alternative — discuss at meeting)

- Add COA Package A (Purity + Germination) for one or more strains.
- Estimated lead: ${GREEN_FUTURE_TEST_ORDER_TIER.leadWithCoaDays}.
- ISTA certificates for AF99, AF143, AF02, AF22 expected separately ~10 Sep 2026 — not required to proceed with Option A.

Open points for quotation

1. Confirm AF102 availability or propose substitute 5th strain.
2. Confirm bulk vs 50-seed sealed pouch format at source (Smile-branded artwork supplied after label Gate 1).
3. State exact THB/EUR price, validity period, balance payment trigger, and indicative ship date.
4. Include batch/lot data template (CSV + signed PDF) with first shipment.

Requested from Green Future

- Formal quotation + pro forma for this test order.
- Working label template with current DOA fields.
- Claims Procedure Template (for SSB internal adaptation).

Prepared by T.M.Y Agro Trade Limited Partnership, trading as Smile Seed Bank
Ref. GF/SSB/2026-0821
`;
