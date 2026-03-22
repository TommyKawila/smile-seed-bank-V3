/**
 * Shared SKU generation: same logic for API (inventory products) and frontend (preview, ProductModal).
 * Rule: Master SKU = [BREEDER-NAME]-[PRODUCT-NAME], UPPERCASE, full breeder name.
 * Breeder part: strip all non-alphanumeric, uppercase (e.g. "420 FastBuds" → "420FASTBUDS").
 * Product part: replace spaces/special with single hyphen, uppercase (e.g. "Rainbow Melon" → "RAINBOW-MELON").
 */

export function toBreederPart(name: string): string {
  return name
    .trim()
    .replace(/[\s\W_]/g, "")
    .toUpperCase() || "BRAND";
}

export function toProductPart(name: string): string {
  const s = name
    .trim()
    .toUpperCase()
    .replace(/[\s\W_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "PRODUCT";
}

export function toMasterSku(breederName: string, productName: string): string {
  const a = toBreederPart(breederName);
  const b = toProductPart(productName);
  return `${a}-${b}`;
}

/** Short prefix from breeder name (2-3 chars): first letter of each word, e.g. "Fast Buds" → "FB" */
export function toBreederPrefix(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const prefix = words
      .slice(0, 3)
      .map((w) => {
        const first = w[0] ?? "";
        if (/\d/.test(first)) return w.slice(0, 2);
        return first.toUpperCase();
      })
      .join("")
      .replace(/[^A-Z0-9]/g, "");
    return prefix.slice(0, 3) || "BR";
  }
  const s = name.trim().replace(/\s/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.slice(0, 3) || "BR";
}

export function packSizeNum(unitLabel: string): string {
  const m = unitLabel.match(/(\d+)/);
  return m ? m[1]! : "1";
}

/** Extract pack size (1–99) from unit_label. Handles "3", "3 Seeds", "1 Seed", "10 Seeds". Returns 1 if invalid. */
export function parsePackFromUnitLabel(unitLabel: string | null | undefined): number {
  if (!unitLabel || typeof unitLabel !== "string") return 1;
  const m = unitLabel.match(/^(\d+)(\s*seeds?)?$/i) || unitLabel.match(/(\d+)/);
  const n = m ? parseInt(m[1]!, 10) : 1;
  const valid = Number.isInteger(n) && n >= 1 && n <= 99;
  return valid ? n : 1;
}

export function toVariantSku(masterSku: string, unitLabel: string): string {
  return `${masterSku}-${packSizeNum(unitLabel)}`;
}
