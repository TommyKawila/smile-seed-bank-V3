import type { BulkSupplierSlug } from "@/lib/bulk-seeds-book";

export type BulkSharePreset = "gf" | "sg" | "both";

export function suppliersForSharePreset(preset: BulkSharePreset): BulkSupplierSlug[] {
  if (preset === "gf") return ["green-future"];
  if (preset === "sg") return ["seeds-genetics"];
  return ["green-future", "seeds-genetics"];
}

export function sharePresetFromSuppliers(suppliers: BulkSupplierSlug[]): BulkSharePreset {
  const hasGf = suppliers.includes("green-future");
  const hasSg = suppliers.includes("seeds-genetics");
  if (hasGf && hasSg) return "both";
  if (hasSg) return "sg";
  return "gf";
}

export function shareStrainLabel(suppliers: BulkSupplierSlug[]): string {
  const hasGf = suppliers.includes("green-future");
  const hasSg = suppliers.includes("seeds-genetics");
  if (hasGf && hasSg) return "โชว์รายการสายพันธุ์ (GF + SG)";
  if (hasSg) return "โชว์รายการสายพันธุ์ (Seeds Genetics)";
  return "โชว์รายการสายพันธุ์ (SGF Seeds)";
}

export function mintButtonLabel(preset: BulkSharePreset): string {
  if (preset === "both") return "สร้างลิงก์ GF + SG";
  if (preset === "sg") return "สร้างลิงก์ SG only";
  return "สร้างลิงก์ GF only";
}
