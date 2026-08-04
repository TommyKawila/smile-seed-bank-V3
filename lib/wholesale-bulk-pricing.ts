/**
 * B2B Bulk Order pricing — integer THB (ceil), editable via wholesale_settings.tiers v2.
 */

export type StrainTier = {
  minQty: number;
  maxQty: number | null;
  thbPerSeed: number;
};

export type BulkPerk = {
  minTotalQty: number;
  thbPerSeed: number;
  freeCoaCount: number;
  freeCoaValueEachThb: number;
};

export type BulkPricingConfig = {
  version: 2;
  eurThb: number;
  microPackQty: number;
  microPackThb: number;
  strainTiers: StrainTier[];
  bulkPerks: BulkPerk[];
  coaPackageAThb: number;
  coaPackageBThb: number;
};

export type BulkQuoteLineInput = {
  strainId: string;
  name: string;
  quantity: number;
};

export type CoaMode = "none" | "with";

export type CoaOptions = {
  mode: CoaMode;
  buyExtra: boolean;
  packageACount: number;
  packageBCount: number;
};

export type ResolvedLine = BulkQuoteLineInput & {
  valid: boolean;
  unitThb: number;
  lineTotalThb: number;
  isMicroPack: boolean;
};

export type BulkQuoteResult = {
  lines: ResolvedLine[];
  totalSeeds: number;
  allValid: boolean;
  bulkUnlocked: boolean;
  activePerk: BulkPerk | null;
  unitThbForBulk: number | null;
  freeCoaCount: number;
  freeCoaValueThb: number;
  seedTotalThb: number;
  extraCoaThb: number;
  grandTotalThb: number;
  depositThb: number;
  balanceThb: number;
  upsell: string | null;
  freeCoaMessage: string | null;
};

export const DEFAULT_BULK_PRICING: BulkPricingConfig = {
  version: 2,
  eurThb: 38.44,
  microPackQty: 100,
  microPackThb: 50,
  strainTiers: [
    { minQty: 500, maxQty: 999, thbPerSeed: 39 },
    { minQty: 1000, maxQty: 2499, thbPerSeed: 33 },
  ],
  bulkPerks: [
    {
      minTotalQty: 2500,
      thbPerSeed: 33,
      freeCoaCount: 1,
      freeCoaValueEachThb: 8350,
    },
    {
      minTotalQty: 5000,
      thbPerSeed: 25,
      freeCoaCount: 2,
      freeCoaValueEachThb: 8350,
    },
    {
      minTotalQty: 10000,
      thbPerSeed: 22,
      freeCoaCount: 4,
      freeCoaValueEachThb: 8350,
    },
    {
      minTotalQty: 25000,
      thbPerSeed: 18,
      freeCoaCount: 5,
      freeCoaValueEachThb: 8350,
    },
  ],
  coaPackageAThb: 8350,
  coaPackageBThb: 16700,
};

export function ceilThb(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.ceil(n);
}

export function formatThb(n: number): string {
  return `${ceilThb(n).toLocaleString("en-US")} THB`;
}

export function thbToEurDisplay(thb: number, eurThb: number): number {
  const fx = eurThb > 0 ? eurThb : DEFAULT_BULK_PRICING.eurThb;
  return ceilThb(thb / fx);
}

export function isMicroPackQty(qty: number, config: BulkPricingConfig): boolean {
  return Math.floor(qty) === config.microPackQty;
}

export function isValidQty(qty: number, config: BulkPricingConfig): boolean {
  const q = Math.floor(qty);
  if (q === config.microPackQty) return true;
  return q >= 500;
}

export function qtyNeedsNudge(qty: number, config: BulkPricingConfig): boolean {
  const q = Math.floor(qty);
  return q >= 1 && q < 500 && q !== config.microPackQty;
}

function strainUnitThb(qty: number, config: BulkPricingConfig): number {
  const q = Math.floor(qty);
  if (q === config.microPackQty) return ceilThb(config.microPackThb);
  const sorted = [...config.strainTiers].sort((a, b) => b.minQty - a.minQty);
  for (const t of sorted) {
    if (q < t.minQty) continue;
    if (t.maxQty != null && q > t.maxQty) continue;
    return ceilThb(t.thbPerSeed);
  }
  // Above last strain tier max but no bulk unlock yet — use highest strain tier rate
  const byMin = [...config.strainTiers].sort((a, b) => a.minQty - b.minQty);
  const last = byMin[byMin.length - 1];
  if (last && q >= last.minQty) return ceilThb(last.thbPerSeed);
  return 0;
}

function resolveActivePerk(
  totalSeeds: number,
  allLinesMin500: boolean,
  config: BulkPricingConfig
): BulkPerk | null {
  if (!allLinesMin500 || totalSeeds <= 0) return null;
  const sorted = [...config.bulkPerks].sort(
    (a, b) => b.minTotalQty - a.minTotalQty
  );
  for (const p of sorted) {
    if (totalSeeds >= p.minTotalQty) return p;
  }
  return null;
}

export function upsellNudge(
  totalSeeds: number,
  allLinesMin500: boolean,
  config: BulkPricingConfig
): string | null {
  if (!allLinesMin500 || totalSeeds <= 0) return null;
  const sorted = [...config.bulkPerks].sort(
    (a, b) => a.minTotalQty - b.minTotalQty
  );
  const next = sorted.find((p) => totalSeeds < p.minTotalQty);
  if (!next) return null;
  const need = next.minTotalQty - totalSeeds;
  if (need <= 0 || need > 2000) return null;
  const free =
    next.freeCoaCount > 0
      ? ` และรับฟรี COA ${next.freeCoaCount} ใบ`
      : "";
  return `💡 เพิ่มอีก ${need.toLocaleString("en-US")} เมล็ด เพื่อปลดล็อกเรท ${ceilThb(next.thbPerSeed).toLocaleString("en-US")} บาท/เมล็ด${free}!`;
}

export function parseBulkPricingConfig(raw: unknown): BulkPricingConfig {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw as { version?: number }).version === 2
  ) {
    const o = raw as Partial<BulkPricingConfig>;
    const strainTiers = Array.isArray(o.strainTiers)
      ? o.strainTiers
          .map((t) => ({
            minQty: Math.floor(Number(t.minQty)),
            maxQty:
              t.maxQty == null || t.maxQty === ("" as unknown)
                ? null
                : Math.floor(Number(t.maxQty)),
            thbPerSeed: ceilThb(Number(t.thbPerSeed)),
          }))
          .filter((t) => t.minQty > 0 && t.thbPerSeed > 0)
      : [];
    const bulkPerks = Array.isArray(o.bulkPerks)
      ? o.bulkPerks
          .map((p) => ({
            minTotalQty: Math.floor(Number(p.minTotalQty)),
            thbPerSeed: ceilThb(Number(p.thbPerSeed)),
            freeCoaCount: Math.max(0, Math.floor(Number(p.freeCoaCount))),
            freeCoaValueEachThb: ceilThb(Number(p.freeCoaValueEachThb)),
          }))
          .filter((p) => p.minTotalQty > 0 && p.thbPerSeed > 0)
      : [];

    return {
      version: 2,
      eurThb:
        Number.isFinite(Number(o.eurThb)) && Number(o.eurThb) > 0
          ? Number(o.eurThb)
          : DEFAULT_BULK_PRICING.eurThb,
      microPackQty: Math.floor(Number(o.microPackQty)) || 100,
      microPackThb: ceilThb(
        Number(o.microPackThb) || DEFAULT_BULK_PRICING.microPackThb
      ),
      strainTiers: strainTiers.length
        ? strainTiers
        : DEFAULT_BULK_PRICING.strainTiers,
      bulkPerks: bulkPerks.length ? bulkPerks : DEFAULT_BULK_PRICING.bulkPerks,
      coaPackageAThb: ceilThb(
        Number(o.coaPackageAThb) || DEFAULT_BULK_PRICING.coaPackageAThb
      ),
      coaPackageBThb: ceilThb(
        Number(o.coaPackageBThb) || DEFAULT_BULK_PRICING.coaPackageBThb
      ),
    };
  }
  return { ...DEFAULT_BULK_PRICING };
}

export function normalizeBulkPricingConfig(
  input: BulkPricingConfig
): BulkPricingConfig {
  return parseBulkPricingConfig({ ...input, version: 2 });
}

export function resolveQuote(
  linesIn: BulkQuoteLineInput[],
  config: BulkPricingConfig = DEFAULT_BULK_PRICING,
  coa: CoaOptions = {
    mode: "none",
    buyExtra: false,
    packageACount: 0,
    packageBCount: 0,
  }
): BulkQuoteResult {
  const linesBase = linesIn.map((l) => ({
    ...l,
    quantity: Math.max(0, Math.floor(l.quantity)),
    name: l.name.trim(),
  }));
  const activeLines = linesBase.filter((l) => l.name && l.quantity > 0);

  const totalSeeds = activeLines.reduce((s, l) => s + l.quantity, 0);
  const allValid =
    activeLines.length > 0 &&
    activeLines.every((l) => isValidQty(l.quantity, config));
  const allLinesMin500 =
    activeLines.length > 0 && activeLines.every((l) => l.quantity >= 500);

  const perk = resolveActivePerk(totalSeeds, allLinesMin500, config);
  const bulkUnlocked = perk != null;

  const lines: ResolvedLine[] = linesBase.map((l) => {
    const valid = isValidQty(l.quantity, config);
    const isMicro = isMicroPackQty(l.quantity, config);
    let unitThb = 0;
    if (valid) {
      if (isMicro) {
        unitThb = ceilThb(config.microPackThb);
      } else if (perk) {
        unitThb = ceilThb(perk.thbPerSeed);
      } else {
        unitThb = strainUnitThb(l.quantity, config);
      }
    }
    return {
      ...l,
      valid,
      isMicroPack: isMicro,
      unitThb,
      lineTotalThb: ceilThb(unitThb * l.quantity),
    };
  });

  const seedTotalThb = lines.reduce((s, l) => s + l.lineTotalThb, 0);

  const freeCoaCount = perk ? perk.freeCoaCount : 0;
  const freeCoaValueThb = freeCoaCount
    ? ceilThb(freeCoaCount * (perk?.freeCoaValueEachThb ?? 8350))
    : 0;

  let extraCoaThb = 0;
  if (coa.mode === "with" && coa.buyExtra) {
    const a = Math.max(0, Math.floor(coa.packageACount));
    const b = Math.max(0, Math.floor(coa.packageBCount));
    extraCoaThb = ceilThb(
      a * config.coaPackageAThb + b * config.coaPackageBThb
    );
  }

  const grandTotalThb = ceilThb(seedTotalThb + extraCoaThb);
  const depositThb = ceilThb(grandTotalThb / 2);
  const balanceThb = Math.max(0, grandTotalThb - depositThb);

  const freeCoaMessage =
    freeCoaCount > 0
      ? `คุณได้รับสิทธิ์ตรวจ COA ฟรี ${freeCoaCount} สายพันธุ์! (ประหยัดเงินได้ ${freeCoaValueThb.toLocaleString("en-US")} บาท)`
      : null;

  return {
    lines,
    totalSeeds,
    allValid,
    bulkUnlocked,
    activePerk: perk,
    unitThbForBulk: perk ? ceilThb(perk.thbPerSeed) : null,
    freeCoaCount,
    freeCoaValueThb,
    seedTotalThb,
    extraCoaThb,
    grandTotalThb,
    depositThb,
    balanceThb,
    upsell: upsellNudge(totalSeeds, allLinesMin500, config),
    freeCoaMessage,
  };
}
