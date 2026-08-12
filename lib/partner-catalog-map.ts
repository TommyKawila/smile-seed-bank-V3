import type {
  PartnerCoaServiceRecord,
  PartnerDocumentRecord,
  PartnerIstaStatus,
  PartnerPriceListRecord,
  PartnerPriceTierRecord,
  PartnerSeedFormat,
  PartnerStockStatus,
  PartnerStrainRecord,
  PartnerSupplierRecord,
} from "@/types/partner-catalog";

type SupplierRow = {
  id: bigint;
  slug: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  tax_id: string | null;
  email: string | null;
  notes: string | null;
};

type DocumentRow = {
  id: bigint;
  supplier_id: bigint;
  title: string;
  doc_type: string;
  file_url: string;
  file_name: string;
  mime: string;
  issued_at: string | null;
  ref_code: string | null;
  notes: string | null;
};

type StrainRow = {
  id: bigint;
  supplier_id: bigint;
  variety_code: string;
  strain_name: string;
  seed_format: string;
  thc_range: string | null;
  cbd_note: string | null;
  cycle_days: string | null;
  height_cm: string | null;
  yield_gm2: string | null;
  type_label: string | null;
  stock_status: string;
  dominant_terpene: string | null;
  secondary_terpene: string | null;
  flavor_1: string | null;
  flavor_2: string | null;
  ista_status: string;
  ista_notes: string | null;
  source_document_id: bigint | null;
  is_active: boolean;
  sort_order: number;
};

export function toSupplierRecord(row: SupplierRow): PartnerSupplierRecord {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    legalName: row.legal_name,
    address: row.address,
    taxId: row.tax_id,
    email: row.email,
    notes: row.notes,
  };
}

export function toDocumentRecord(row: DocumentRow): PartnerDocumentRecord {
  return {
    id: String(row.id),
    supplierId: String(row.supplier_id),
    title: row.title,
    docType: row.doc_type as PartnerDocumentRecord["docType"],
    fileUrl: row.file_url,
    fileName: row.file_name,
    mime: row.mime,
    issuedAt: row.issued_at,
    refCode: row.ref_code,
    notes: row.notes,
  };
}

export function toStrainRecord(row: StrainRow): PartnerStrainRecord {
  return {
    id: String(row.id),
    supplierId: String(row.supplier_id),
    varietyCode: row.variety_code,
    strainName: row.strain_name,
    seedFormat: row.seed_format as PartnerSeedFormat,
    thcRange: row.thc_range,
    cbdNote: row.cbd_note,
    cycleDays: row.cycle_days,
    heightCm: row.height_cm,
    yieldGm2: row.yield_gm2,
    typeLabel: row.type_label,
    stockStatus: row.stock_status as PartnerStockStatus,
    dominantTerpene: row.dominant_terpene,
    secondaryTerpene: row.secondary_terpene,
    flavor1: row.flavor_1,
    flavor2: row.flavor_2,
    istaStatus: row.ista_status as PartnerIstaStatus,
    istaNotes: row.ista_notes,
    sourceDocumentId: row.source_document_id ? String(row.source_document_id) : null,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

type PriceListRow = {
  id: bigint;
  supplier_id: bigint;
  title: string;
  ref_code: string | null;
  issued_at: string | null;
  status: string;
  currency_primary: string;
  advance_payment_pct: number;
  lead_without_coa_days: string | null;
  coa_lab_days: number | null;
  ship_after_coa_days: string | null;
  notes: string | null;
  source_document_id: bigint | null;
  tiers: TierRow[];
  coa_services: CoaRow[];
};

type TierRow = {
  id: bigint;
  price_list_id: bigint;
  code: string;
  label: string;
  qty_description: string | null;
  eur_per_seed: { toString(): string };
  thb_per_seed: { toString(): string };
  coa_included_count: number;
  coa_notes: string | null;
  sort_order: number;
};

type CoaRow = {
  id: bigint;
  price_list_id: bigint;
  code: string;
  label: string;
  usd_per_strain: { toString(): string };
  thb_per_strain: { toString(): string };
  sort_order: number;
};

export function toPriceTierRecord(row: TierRow): PartnerPriceTierRecord {
  return {
    id: String(row.id),
    priceListId: String(row.price_list_id),
    code: row.code,
    label: row.label,
    qtyDescription: row.qty_description,
    eurPerSeed: row.eur_per_seed.toString(),
    thbPerSeed: row.thb_per_seed.toString(),
    coaIncludedCount: row.coa_included_count,
    coaNotes: row.coa_notes,
    sortOrder: row.sort_order,
  };
}

export function toCoaServiceRecord(row: CoaRow): PartnerCoaServiceRecord {
  return {
    id: String(row.id),
    priceListId: String(row.price_list_id),
    code: row.code,
    label: row.label,
    usdPerStrain: row.usd_per_strain.toString(),
    thbPerStrain: row.thb_per_strain.toString(),
    sortOrder: row.sort_order,
  };
}

export function toPriceListRecord(row: PriceListRow): PartnerPriceListRecord {
  return {
    id: String(row.id),
    supplierId: String(row.supplier_id),
    title: row.title,
    refCode: row.ref_code,
    issuedAt: row.issued_at,
    status: row.status as PartnerPriceListRecord["status"],
    currencyPrimary: row.currency_primary,
    advancePaymentPct: row.advance_payment_pct,
    leadWithoutCoaDays: row.lead_without_coa_days,
    coaLabDays: row.coa_lab_days,
    shipAfterCoaDays: row.ship_after_coa_days,
    notes: row.notes,
    sourceDocumentId: row.source_document_id ? String(row.source_document_id) : null,
    tiers: row.tiers.map(toPriceTierRecord),
    coaServices: row.coa_services.map(toCoaServiceRecord),
  };
}
