import {
  gfFulfillmentTier,
  type FulfillmentTier,
} from "@/lib/wholesale-fulfillment";
import {
  isValidQty,
  resolveQuote,
  type BulkPricingConfig,
  type BulkQuoteResult,
  type CoaMode,
} from "@/lib/wholesale-bulk-pricing";

export type DepositQuoteLine = {
  varietyCode: string;
  strainName: string;
  quantity: number;
  fulfillmentTier: FulfillmentTier;
};

export type DepositQuoteInput = {
  lines: Array<{ varietyCode: string; strainName: string; quantity: number }>;
  config: BulkPricingConfig;
  coaMode: CoaMode;
  buyExtraCoa: boolean;
  coaPackageA: number;
  coaPackageB: number;
};

/**
 * Public /wholesale deposit quote.
 * Lab fees are charged only when the customer opts in. Docs-pending strains
 * do not force Package A — that total must match the calculator.
 */
export function quoteWholesaleDeposit(input: DepositQuoteInput): {
  lines: DepositQuoteLine[];
  quote: BulkQuoteResult;
  packageA: number;
  packageB: number;
} {
  const lines = input.lines
    .map((l) => ({
      varietyCode: l.varietyCode.trim().toUpperCase(),
      strainName: l.strainName.trim(),
      quantity: Math.floor(l.quantity),
      fulfillmentTier: gfFulfillmentTier(l.varietyCode),
    }))
    .filter(
      (l) =>
        l.varietyCode &&
        l.strainName &&
        isValidQty(l.quantity, input.config, true)
    );

  const packageA = Math.max(0, Math.floor(input.coaPackageA));
  const packageB = Math.max(0, Math.floor(input.coaPackageB));

  const quote = resolveQuote(
    lines.map((l) => ({
      strainId: l.varietyCode,
      name: `${l.varietyCode} · ${l.strainName}`,
      quantity: l.quantity,
      fulfillmentTier: l.fulfillmentTier,
    })),
    input.config,
    {
      mode: input.coaMode,
      buyExtra: input.buyExtraCoa,
      packageACount: packageA,
      packageBCount: packageB,
      pilotMode: true,
    }
  );

  return { lines, quote, packageA, packageB };
}
