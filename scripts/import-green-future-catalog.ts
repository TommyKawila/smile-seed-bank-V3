import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import { resolve } from "node:path";

config();
config({ path: resolve(process.cwd(), ".env.local"), override: true });

type CatalogStrain = {
  varietyCode: string;
  strainName: string;
  seedFormat: string;
  thcRange?: string | null;
  cbdNote?: string | null;
  cycleDays?: string | null;
  heightCm?: string | null;
  yieldGm2?: string | null;
  typeLabel?: string | null;
  stockStatus?: string;
  dominantTerpene?: string | null;
  secondaryTerpene?: string | null;
  flavor1?: string | null;
  flavor2?: string | null;
  istaStatus?: string;
  istaNotes?: string | null;
  sortOrder?: number;
};

const DOCS = [
  {
    title: "AUTO FEM — B2B Stock Catalog",
    docType: "CATALOG_AUTO_FEM",
    fileUrl: "/partner-docs/green-future/auto-fem.pdf",
    fileName: "auto-fem.pdf",
    issuedAt: null as string | null,
    refCode: null as string | null,
    notes: "Green Future autoflower feminized collection",
  },
  {
    title: "FEM — B2B Stock Catalog",
    docType: "CATALOG_FEM",
    fileUrl: "/partner-docs/green-future/fem.pdf",
    fileName: "fem.pdf",
    issuedAt: null,
    refCode: null,
    notes: "Green Future photoperiod feminized collection",
  },
  {
    title: "ISTA Analysis — Confirmed Varieties",
    docType: "ISTA_LETTER",
    fileUrl: "/partner-docs/green-future/ista-letter.pdf",
    fileName: "ista-letter.pdf",
    issuedAt: "2026-08-10",
    refCode: "GF/SSB/2026-0810",
    notes: "ISTA confirmed: AF99, AF143, AF02, AF22",
  },
  {
    title: "Seed Supply & COA Certification Proposal",
    docType: "PRICE_LIST",
    fileUrl: "/partner-docs/green-future/seed-supply-coa-proposal.pdf",
    fileName: "seed-supply-coa-proposal.pdf",
    issuedAt: "2026-08-03",
    refCode: "GF/SSB/2026-0803",
    notes: "Supplier cost tiers + COA fees — preliminary & confidential",
  },
] as const;

type PriceListSeed = {
  title: string;
  refCode: string;
  issuedAt: string;
  document: {
    title: string;
    fileUrl: string;
    fileName: string;
    notes?: string;
  };
  terms: {
    currencyPrimary: string;
    advancePaymentPct: number;
    leadWithoutCoaDays: string;
    coaLabDays: number;
    shipAfterCoaDays: string;
    notes?: string;
  };
  tiers: Array<{
    code: string;
    label: string;
    qtyDescription: string;
    eurPerSeed: string;
    thbPerSeed: string;
    coaIncludedCount: number;
    coaNotes?: string;
    sortOrder: number;
  }>;
  coaServices: Array<{
    code: string;
    label: string;
    usdPerStrain: string;
    thbPerStrain: string;
    sortOrder: number;
  }>;
};

const FIELD_LIMITS: Record<string, number> = {
  strainName: 200,
  thcRange: 32,
  cbdNote: 32,
  cycleDays: 32,
  heightCm: 32,
  yieldGm2: 64,
  typeLabel: 64,
  dominantTerpene: 128,
  secondaryTerpene: 128,
  flavor1: 256,
  flavor2: 256,
};

function clip(value: string | null | undefined, max: number): string | null {
  if (value == null) return null;
  const s = value.trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { resolveDirectDbUrl } = await import("@/lib/db-direct-url");
  const { GREEN_FUTURE_SLUG } = await import("@/types/partner-catalog");

  const dbUrl = resolveDirectDbUrl();
  console.log("Import via direct DB:", dbUrl.match(/@([^:/]+)/)?.[1] ?? "unknown");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: dbUrl }),
  });

  try {
    const catalogPath = path.join(
      process.cwd(),
      "data/partners/green-future/catalog.json"
    );
    const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as {
      strains: CatalogStrain[];
    };

    const supplier = await prisma.partner_suppliers.upsert({
      where: { slug: GREEN_FUTURE_SLUG },
      create: {
        slug: GREEN_FUTURE_SLUG,
        name: "Green Future",
        legal_name: "Green Future (Global) Co., Ltd.",
        address:
          "49/1 Moo 4, King Kaew 30, Bang Phli District, Samut Prakan 10540, Thailand",
        tax_id: "0115567016157",
        email: "info@greenfuture.global",
        notes: "Thailand legal seed production partner — B2B / GACP supply",
      },
      update: {
        name: "Green Future",
        legal_name: "Green Future (Global) Co., Ltd.",
        address:
          "49/1 Moo 4, King Kaew 30, Bang Phli District, Samut Prakan 10540, Thailand",
        tax_id: "0115567016157",
        email: "info@greenfuture.global",
      },
    });

    const docIds = new Map<string, bigint>();
    for (const doc of DOCS) {
      const existing = await prisma.partner_documents.findFirst({
        where: { supplier_id: supplier.id, doc_type: doc.docType },
      });
      const row = existing
        ? await prisma.partner_documents.update({
            where: { id: existing.id },
            data: {
              title: doc.title,
              file_url: doc.fileUrl,
              file_name: doc.fileName,
              issued_at: doc.issuedAt,
              ref_code: doc.refCode,
              notes: doc.notes,
            },
          })
        : await prisma.partner_documents.create({
            data: {
              supplier_id: supplier.id,
              title: doc.title,
              doc_type: doc.docType,
              file_url: doc.fileUrl,
              file_name: doc.fileName,
              issued_at: doc.issuedAt,
              ref_code: doc.refCode,
              notes: doc.notes,
            },
          });
      docIds.set(doc.docType, row.id);
    }

    let upserted = 0;
    for (const s of raw.strains) {
      const sourceDocId =
        s.seedFormat === "AUTO_FEM"
          ? docIds.get("CATALOG_AUTO_FEM")
          : s.seedFormat === "FEM"
            ? docIds.get("CATALOG_FEM")
            : undefined;

      await prisma.partner_strains.upsert({
        where: {
          supplier_id_variety_code: {
            supplier_id: supplier.id,
            variety_code: s.varietyCode,
          },
        },
        create: {
          supplier_id: supplier.id,
          variety_code: s.varietyCode,
          strain_name: clip(s.strainName, FIELD_LIMITS.strainName) ?? s.varietyCode,
          seed_format: s.seedFormat,
          thc_range: clip(s.thcRange, FIELD_LIMITS.thcRange),
          cbd_note: clip(s.cbdNote, FIELD_LIMITS.cbdNote),
          cycle_days: clip(s.cycleDays, FIELD_LIMITS.cycleDays),
          height_cm: clip(s.heightCm, FIELD_LIMITS.heightCm),
          yield_gm2: clip(s.yieldGm2, FIELD_LIMITS.yieldGm2),
          type_label: clip(s.typeLabel, FIELD_LIMITS.typeLabel),
          stock_status: s.stockStatus ?? "UNKNOWN",
          dominant_terpene: clip(s.dominantTerpene, FIELD_LIMITS.dominantTerpene),
          secondary_terpene: clip(s.secondaryTerpene, FIELD_LIMITS.secondaryTerpene),
          flavor_1: clip(s.flavor1, FIELD_LIMITS.flavor1),
          flavor_2: clip(s.flavor2, FIELD_LIMITS.flavor2),
          ista_status: s.istaStatus ?? "NONE",
          ista_notes: s.istaNotes ?? null,
          source_document_id: sourceDocId,
          sort_order: s.sortOrder ?? 0,
          is_active: true,
        },
        update: {
          strain_name: clip(s.strainName, FIELD_LIMITS.strainName) ?? s.varietyCode,
          seed_format: s.seedFormat,
          thc_range: clip(s.thcRange, FIELD_LIMITS.thcRange),
          cbd_note: clip(s.cbdNote, FIELD_LIMITS.cbdNote),
          cycle_days: clip(s.cycleDays, FIELD_LIMITS.cycleDays),
          height_cm: clip(s.heightCm, FIELD_LIMITS.heightCm),
          yield_gm2: clip(s.yieldGm2, FIELD_LIMITS.yieldGm2),
          type_label: clip(s.typeLabel, FIELD_LIMITS.typeLabel),
          stock_status: s.stockStatus ?? "UNKNOWN",
          dominant_terpene: clip(s.dominantTerpene, FIELD_LIMITS.dominantTerpene),
          secondary_terpene: clip(s.secondaryTerpene, FIELD_LIMITS.secondaryTerpene),
          flavor_1: clip(s.flavor1, FIELD_LIMITS.flavor1),
          flavor_2: clip(s.flavor2, FIELD_LIMITS.flavor2),
          ista_status: s.istaStatus ?? "NONE",
          ista_notes: s.istaNotes ?? null,
          source_document_id: sourceDocId,
          sort_order: s.sortOrder ?? 0,
          is_active: true,
        },
      });
      upserted += 1;
    }

    const priceListPath = path.join(
      process.cwd(),
      "data/partners/green-future/price-list-gf-ssb-2026-0803.json"
    );
    const priceSeed = JSON.parse(readFileSync(priceListPath, "utf8")) as PriceListSeed;
    const priceDocId = docIds.get("PRICE_LIST");

    await prisma.partner_price_lists.updateMany({
      where: { supplier_id: supplier.id, status: "ACTIVE" },
      data: { status: "SUPERSEDED" },
    });

    const priceList = await prisma.partner_price_lists.create({
      data: {
        supplier_id: supplier.id,
        title: priceSeed.title,
        ref_code: priceSeed.refCode,
        issued_at: priceSeed.issuedAt,
        status: "ACTIVE",
        currency_primary: priceSeed.terms.currencyPrimary,
        advance_payment_pct: priceSeed.terms.advancePaymentPct,
        lead_without_coa_days: priceSeed.terms.leadWithoutCoaDays,
        coa_lab_days: priceSeed.terms.coaLabDays,
        ship_after_coa_days: priceSeed.terms.shipAfterCoaDays,
        notes: priceSeed.terms.notes ?? null,
        source_document_id: priceDocId,
      },
    });

    for (const tier of priceSeed.tiers) {
      await prisma.partner_price_tiers.upsert({
        where: {
          price_list_id_code: {
            price_list_id: priceList.id,
            code: tier.code,
          },
        },
        create: {
          price_list_id: priceList.id,
          code: tier.code,
          label: tier.label,
          qty_description: tier.qtyDescription,
          eur_per_seed: tier.eurPerSeed,
          thb_per_seed: tier.thbPerSeed,
          coa_included_count: tier.coaIncludedCount,
          coa_notes: tier.coaNotes ?? null,
          sort_order: tier.sortOrder,
        },
        update: {
          label: tier.label,
          qty_description: tier.qtyDescription,
          eur_per_seed: tier.eurPerSeed,
          thb_per_seed: tier.thbPerSeed,
          coa_included_count: tier.coaIncludedCount,
          coa_notes: tier.coaNotes ?? null,
          sort_order: tier.sortOrder,
        },
      });
    }

    for (const coa of priceSeed.coaServices) {
      await prisma.partner_coa_services.upsert({
        where: {
          price_list_id_code: {
            price_list_id: priceList.id,
            code: coa.code,
          },
        },
        create: {
          price_list_id: priceList.id,
          code: coa.code,
          label: coa.label,
          usd_per_strain: coa.usdPerStrain,
          thb_per_strain: coa.thbPerStrain,
          sort_order: coa.sortOrder,
        },
        update: {
          label: coa.label,
          usd_per_strain: coa.usdPerStrain,
          thb_per_strain: coa.thbPerStrain,
          sort_order: coa.sortOrder,
        },
      });
    }

    console.log(
      `Green Future import complete: ${upserted} strains, ${DOCS.length} documents, price list ${priceSeed.refCode} (${priceSeed.tiers.length} tiers)`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
