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

export function packSizeNum(unitLabel: string): string {
  const m = unitLabel.match(/(\d+)/);
  return m ? m[1]! : "1";
}

export function toVariantSku(masterSku: string, unitLabel: string): string {
  return `${masterSku}-${packSizeNum(unitLabel)}`;
}
