/**
 * Guard: B2B / assistant pricing must use real qty against SG stairs
 * (50–100 / 101–250 / 251–500), not a ×50 snap that drops 101→100 and 251→250.
 */
import { B2B_BREEDER_SG } from "@/types/b2b-quote";
import {
  applyBulkBookPrice,
  bulkUnitPriceForBreeder,
  clampB2BBulkQty,
} from "@/lib/b2b-quote-bulk-price";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

function nearly(a: number, b: number, eps = 0.02): boolean {
  return Math.abs(a - b) <= eps;
}

async function main() {
  assert(clampB2BBulkQty(101) === 101, "clamp 101 must stay 101");
  assert(clampB2BBulkQty(251) === 251, "clamp 251 must stay 251");
  assert(clampB2BBulkQty(40) === 50, "clamp below min → 50");

  const p100 = bulkUnitPriceForBreeder(B2B_BREEDER_SG, 100, "EUR");
  const p101 = bulkUnitPriceForBreeder(B2B_BREEDER_SG, 101, "EUR");
  const p250 = bulkUnitPriceForBreeder(B2B_BREEDER_SG, 250, "EUR");
  const p251 = bulkUnitPriceForBreeder(B2B_BREEDER_SG, 251, "EUR");

  assert(p100 != null && nearly(p100, 3.1), `100 seeds should be Starter €3.10, got ${p100}`);
  assert(p101 != null && p100 != null && p101 < p100 - 0.2, `101 must drop below Starter, got ${p101} vs ${p100}`);
  assert(p250 != null && nearly(p250, p101 ?? 0), `250 should stay on the 101-tier, got ${p250}`);
  assert(p251 != null && p250 != null && p251 < p250 - 0.1, `251 must drop below 250-tier, got ${p251} vs ${p250}`);

  const applied = applyBulkBookPrice(
    {
      id: "t",
      strainName: "Big Bud",
      breederName: B2B_BREEDER_SG,
      quantity: 101,
      unitPrice: 9,
      lineTotal: 0,
    },
    "EUR"
  );
  assert(applied.quantity === 101, `applyBulkBookPrice must keep 101, got ${applied.quantity}`);
  assert(p101 != null && nearly(applied.unitPrice, p101), `applyBulkBookPrice 101 unit must match book, got ${applied.unitPrice}`);
  assert(p101 != null && nearly(applied.lineTotal, 101 * p101), `101 × book unit, got ${applied.lineTotal}`);

  const applied251 = applyBulkBookPrice(
    {
      id: "t2",
      strainName: "Big Bud",
      breederName: B2B_BREEDER_SG,
      quantity: 251,
      unitPrice: 9,
      lineTotal: 0,
    },
    "EUR"
  );
  assert(applied251.quantity === 251, `applyBulkBookPrice must keep 251, got ${applied251.quantity}`);
  assert(p251 != null && nearly(applied251.unitPrice, p251), `applyBulkBookPrice 251 unit must match book, got ${applied251.unitPrice}`);

  console.log("assert-b2b-bulk-tier-qty: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
