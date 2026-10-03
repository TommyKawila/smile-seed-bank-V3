/**
 * Deposit totals must match the public calculator.
 * Docs-pending strains must not silently add Package A (10,410 THB).
 */
import assert from "node:assert/strict";
import { DEFAULT_BULK_PRICING } from "../lib/wholesale-bulk-pricing";
import { quoteWholesaleDeposit } from "../lib/wholesale-deposit-quote";

const config = DEFAULT_BULK_PRICING;

const seedsOnly = quoteWholesaleDeposit({
  lines: [
    { varietyCode: "af200", strainName: "Example Auto", quantity: 50 },
    { varietyCode: "af201", strainName: "Example Photo", quantity: 50 },
  ],
  config,
  coaMode: "none",
  buyExtraCoa: false,
  coaPackageA: 0,
  coaPackageB: 0,
});

assert.equal(seedsOnly.lines.length, 2);
assert.equal(seedsOnly.lines.every((l) => l.fulfillmentTier === "docs_pending"), true);
assert.equal(seedsOnly.quote.seedTotalThb, 12500);
assert.equal(seedsOnly.quote.extraCoaThb, 0);
assert.equal(seedsOnly.quote.grandTotalThb, 12500);
assert.equal(seedsOnly.quote.depositThb, 6250);
assert.equal(seedsOnly.packageA, 0);

const optedIn = quoteWholesaleDeposit({
  lines: [{ varietyCode: "AF200", strainName: "Example Auto", quantity: 50 }],
  config,
  coaMode: "with",
  buyExtraCoa: true,
  coaPackageA: 1,
  coaPackageB: 0,
});

assert.equal(optedIn.quote.seedTotalThb, 6250);
assert.equal(optedIn.quote.extraCoaThb, config.coaPackageAThb);
assert.equal(optedIn.quote.grandTotalThb, 6250 + config.coaPackageAThb);
assert.equal(optedIn.quote.depositThb, Math.ceil((6250 + config.coaPackageAThb) / 2));
assert.equal(optedIn.packageA, 1);

const pilot = quoteWholesaleDeposit({
  lines: [{ varietyCode: "af99", strainName: "Pilot", quantity: 50 }],
  config,
  coaMode: "none",
  buyExtraCoa: false,
  coaPackageA: 0,
  coaPackageB: 0,
});

assert.equal(pilot.lines[0]?.fulfillmentTier, "docs_ready");
assert.equal(pilot.quote.extraCoaThb, 0);
assert.equal(pilot.quote.depositThb, 3125);

console.log("wholesale deposit quote: ok");
