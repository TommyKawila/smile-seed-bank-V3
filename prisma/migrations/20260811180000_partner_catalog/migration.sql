-- Partner catalog (Green Future B2B/GACP reference)

CREATE TABLE "public"."partner_suppliers" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "legal_name" VARCHAR(300),
    "address" VARCHAR(500),
    "tax_id" VARCHAR(64),
    "email" VARCHAR(320),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_suppliers_slug_key" ON "public"."partner_suppliers"("slug");

CREATE TABLE "public"."partner_documents" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "doc_type" VARCHAR(32) NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_name" VARCHAR(300) NOT NULL,
    "mime" VARCHAR(128) NOT NULL DEFAULT 'application/pdf',
    "issued_at" VARCHAR(10),
    "ref_code" VARCHAR(64),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_partner_documents_supplier_type" ON "public"."partner_documents"("supplier_id", "doc_type");

ALTER TABLE "public"."partner_documents" ADD CONSTRAINT "partner_documents_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "public"."partner_suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE "public"."partner_strains" (
    "id" BIGSERIAL NOT NULL,
    "supplier_id" BIGINT NOT NULL,
    "variety_code" VARCHAR(16) NOT NULL,
    "strain_name" VARCHAR(200) NOT NULL,
    "seed_format" VARCHAR(16) NOT NULL,
    "thc_range" VARCHAR(32),
    "cbd_note" VARCHAR(32),
    "cycle_days" VARCHAR(32),
    "height_cm" VARCHAR(32),
    "yield_gm2" VARCHAR(64),
    "type_label" VARCHAR(64),
    "stock_status" VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
    "dominant_terpene" VARCHAR(128),
    "secondary_terpene" VARCHAR(128),
    "flavor_1" VARCHAR(256),
    "flavor_2" VARCHAR(256),
    "ista_status" VARCHAR(16) NOT NULL DEFAULT 'NONE',
    "ista_notes" TEXT,
    "source_document_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_strains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_partner_strains_supplier_code" ON "public"."partner_strains"("supplier_id", "variety_code");
CREATE INDEX "idx_partner_strains_supplier_format_stock" ON "public"."partner_strains"("supplier_id", "seed_format", "stock_status");
CREATE INDEX "idx_partner_strains_supplier_ista" ON "public"."partner_strains"("supplier_id", "ista_status");

ALTER TABLE "public"."partner_strains" ADD CONSTRAINT "partner_strains_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "public"."partner_suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "public"."partner_strains" ADD CONSTRAINT "partner_strains_source_document_id_fkey"
    FOREIGN KEY ("source_document_id") REFERENCES "public"."partner_documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
