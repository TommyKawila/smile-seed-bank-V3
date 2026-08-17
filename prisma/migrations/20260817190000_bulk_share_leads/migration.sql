CREATE TABLE IF NOT EXISTS "public"."bulk_share_lead_yearly_seq" (
    "year" VARCHAR(4) NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "bulk_share_lead_yearly_seq_pkey" PRIMARY KEY ("year")
);

CREATE TABLE IF NOT EXISTS "public"."bulk_share_leads" (
    "id" BIGSERIAL NOT NULL,
    "ref_number" VARCHAR(48) NOT NULL,
    "contact_name" VARCHAR(200) NOT NULL,
    "line_id" VARCHAR(120) NOT NULL DEFAULT '',
    "phone" VARCHAR(32) NOT NULL DEFAULT '',
    "note" TEXT,
    "share_title" VARCHAR(200) NOT NULL,
    "suppliers" JSONB NOT NULL,
    "eur_thb" DECIMAL(10,4) NOT NULL,
    "subtotal_thb" DECIMAL(12,2) NOT NULL,
    "subtotal_eur" DECIMAL(12,2) NOT NULL,
    "seed_count" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bulk_share_leads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "bulk_share_leads_ref_number_key" ON "public"."bulk_share_leads"("ref_number");
CREATE INDEX IF NOT EXISTS "idx_bulk_share_leads_status_created" ON "public"."bulk_share_leads"("status", "created_at");

CREATE TABLE IF NOT EXISTS "public"."bulk_share_lead_items" (
    "id" BIGSERIAL NOT NULL,
    "lead_id" BIGINT NOT NULL,
    "supplier_slug" VARCHAR(32) NOT NULL,
    "supplier_label" VARCHAR(120) NOT NULL,
    "strain_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(64) NOT NULL DEFAULT '',
    "qty" INTEGER NOT NULL,
    "unit_thb" DECIMAL(12,2) NOT NULL,
    "unit_eur" DECIMAL(12,4) NOT NULL,
    "line_thb" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "bulk_share_lead_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bulk_share_lead_items_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."bulk_share_leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "idx_bulk_share_lead_items_lead_id" ON "public"."bulk_share_lead_items"("lead_id");

ALTER TABLE "public"."bulk_share_lead_yearly_seq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bulk_share_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bulk_share_lead_items" ENABLE ROW LEVEL SECURITY;
