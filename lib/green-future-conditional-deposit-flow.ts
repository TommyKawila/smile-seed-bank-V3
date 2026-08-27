/** Conditional customer deposit terms — Demand Gate before GF PO */

export const GREEN_FUTURE_CONDITIONAL_DEPOSIT_SUBJECT =
  "Internal — GF Programme Conditional Customer Deposit Terms (Demand Gate)";

export const GREEN_FUTURE_CONDITIONAL_DEPOSIT_RAW = `Subject: Internal — GF Programme Conditional Customer Deposit Terms (Demand Gate)

Smile Seed Bank internal — do not send to customers until Regulatory Gate passes
Ref. GF/SSB/2026-0824 · Validate → Market → Deposit → PO

---

A) When deposits open

Customer deposits open only after:

1. Regulatory Gate passed — label/process version reviewed; authority feedback recorded in writing where available; approved marketing wording locked.
2. Green Future quotation received in writing — THB price, 14-day validity, packing fee, lead time, minimum quantity.
3. Smile Seed Bank publishes approved wording on web / email / social (same text across channels).

Before Regulatory Gate: quotation requests only — no public deposits.

---

B) Product scope (first round)

- 5 pilot strains only: AF99, AF143, AF02, AF22, AF102
- Pack format: 50 seeds per producer-sealed pouch (4 pouches per strain in pilot PO)
- Option 1 default: internal lot test at dispatch; external COA optional add-on per strain
- No GACP-certified / COA-guaranteed / audit-guarantee claims

---

C) Deposit structure

| Item | Value |
| --- | --- |
| Deposit type | Conditional reservation deposit |
| Default deposit | 50% of quoted pouch price per line |
| Currency | THB bank transfer |
| Minimum order | 1 sealed pouch (50 seeds) per strain |
| Round close | Fixed closing date stated in each campaign (e.g. 14 days from open) |
| Indicative dispatch | Stated per quotation — not guaranteed until PO accepted |

---

D) Demand Gate threshold (before GF PO)

Issue PO and pay Green Future 50% advance only when:

| Check | Rule |
| --- | --- |
| Customer deposits collected | ≥ GF 50% advance on pilot seed cost + approved packing/processing fee + modest reserve (default 5% buffer) |
| GF confirmation | Written quotation + availability + approved label version + pack format |
| Regulatory Gate | Passed (see evidence checklist) |

Pilot reference (indicative — confirm in GF quotation):

| Item | Indicative THB |
| --- | --- |
| Seed cost 1,000 @ ~44.21/seed landed | ~44,210 |
| GF 50% advance | ~22,105 |
| Packing 20 pouches | ~400 |
| Reserve 5% | ~1,125 |
| **Deposit threshold target** | **~23,630** |

Adjust threshold when final quotation arrives.

---

E) Refund conditions (tell customers upfront)

Full refund if any of:

1. Total conditional deposits do not reach the stated minimum threshold by round close.
2. Green Future does not confirm quotation, lot, price, or pack format in writing before PO deadline.
3. Label or packaging fails Regulatory Gate / written approval.
4. Product cannot be supplied within the stated indicative window and no acceptable alternative is offered.
5. Smile Seed Bank cancels the round before PO for compliance reasons.

Partial refund / credit only if customer cancels after threshold met and before PO — at Smile Seed Bank discretion minus admin cost (default 10% or actual costs incurred).

No refund after PO issued to Green Future except for failure to deliver per accepted PO terms.

---

F) Customer-facing summary (use after Regulatory Gate)

Thai:
"มัดจำจองสิทธิ์แบบมีเงื่อนไข — คืนเงินเต็มหากยอดรวมไม่ถึงขั้นต่ำ หาก Green Future ไม่ยืนยันราคา/ล็อต หรือหากฉลาก/กระบวนการไม่ผ่านการตรวจที่กำหนด ราคาและระยะเวลาเป็นประมาณการตาม quotation"

English:
"Conditional reservation deposit — full refund if the round minimum is not met, if Green Future does not confirm price/lot in writing, or if label/process approval is not obtained. Price and timing are indicative per quotation."

---

G) Internal checklist before opening deposits

- [ ] Regulatory evidence file complete
- [ ] Label version V__ approved in writing
- [ ] GF quotation PDF saved
- [ ] Approved marketing text published (web = email = social)
- [ ] Threshold calculated from final quotation
- [ ] Round close date set
- [ ] Refund policy on checkout / RFQ form
- [ ] Storage ready (+5 to +10°C, RH log)

Prepared by Smile Seed Bank / T.M.Y Agro Trade Limited Partnership
Internal use only
`;

/** Default pilot threshold — update when GF quotation arrives */
export const GF_PILOT_DEPOSIT_THRESHOLD_THB = 23630;

export const GF_PILOT_SEED_COUNT = 1000;

export const GF_PILOT_INDICATIVE_ADVANCE_THB = 22105;

export const GF_PILOT_PACKING_FEE_THB = 400;

export const GF_PILOT_RESERVE_PCT = 5;

export function calcDemandGateThreshold(opts: {
  gfAdvanceThb: number;
  packingFeeThb: number;
  reservePct?: number;
}): number {
  const reserve = opts.reservePct ?? GF_PILOT_RESERVE_PCT;
  const subtotal = opts.gfAdvanceThb + opts.packingFeeThb;
  return Math.ceil(subtotal * (1 + reserve / 100));
}
