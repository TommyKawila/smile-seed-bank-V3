-- Green Future supplier cost / commercial terms (admin-only)

CREATE TABLE "public"."partner_price_lists" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "ref_code" VARCHAR(64),
    "issued_at" VARCHAR(10),
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "currency_primary" VARCHAR(8) NOT NULL DEFAULT 'EUR',
    "advance_payment_pct" INTEGER NOT NULL DEFAULT 50,
    "lead_without_coa_days" VARCHAR(32),
    "coa_lab_days" INTEGER,
    "ship_after_coa_days" VARCHAR(32),
    "notes" TEXT,
    "source_document_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_price_lists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_partner_price_lists_supplier_status"
    ON "public"."partner_price_lists"("supplier_id", "status");

CREATE UNIQUE INDEX "uq_partner_price_lists_supplier_active"
    ON "public"."partner_price_lists"("supplier_id")
    WHERE "status" = 'ACTIVE';

ALTER TABLE "public"."partner_price_lists" ADD CONSTRAINT "partner_price_lists_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "public"."partner_suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "public"."partner_price_lists" ADD CONSTRAINT "partner_price_lists_source_document_id_fkey"
    FOREIGN KEY ("source_document_id") REFERENCES "public"."partner_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE "public"."partner_price_tiers" (
    "id" BIGSERIAL NOT NULL,
    "price_list_id" BIGINT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "qty_description" VARCHAR(500),
    "eur_per_seed" DECIMAL(12, 4) NOT NULL,
    "thb_per_seed" DECIMAL(12, 4) NOT NULL,
    "coa_included_count" INTEGER NOT NULL DEFAULT 0,
    "coa_notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "partner_price_tiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_partner_price_tiers_list_code"
    ON "public"."partner_price_tiers"("price_list_id", "code");

CREATE INDEX "idx_partner_price_tiers_list_sort"
    ON "public"."partner_price_tiers"("price_list_id", "sort_order");

ALTER TABLE "public"."partner_price_tiers" ADD CONSTRAINT "partner_price_tiers_price_list_id_fkey"
    FOREIGN KEY ("price_list_id") REFERENCES "public"."partner_price_lists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE "public"."partner_coa_services" (
    "id" BIGSERIAL NOT NULL,
    "price_list_id" BIGINT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "label" VARCHAR(300) NOT NULL,
    "usd_per_strain" DECIMAL(12, 2) NOT NULL,
    "thb_per_strain" DECIMAL(12, 2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "partner_coa_services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_partner_coa_services_list_code"
    ON "public"."partner_coa_services"("price_list_id", "code");

CREATE INDEX "idx_partner_coa_services_list_sort"
    ON "public"."partner_coa_services"("price_list_id", "sort_order");

ALTER TABLE "public"."partner_coa_services" ADD CONSTRAINT "partner_coa_services_price_list_id_fkey"
    FOREIGN KEY ("price_list_id") REFERENCES "public"."partner_price_lists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
