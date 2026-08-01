CREATE TABLE IF NOT EXISTS "public"."b2b_quote_yearly_seq" (
    "year" VARCHAR(4) NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "b2b_quote_yearly_seq_pkey" PRIMARY KEY ("year")
);

CREATE TABLE IF NOT EXISTS "public"."b2b_quotes" (
    "id" BIGSERIAL NOT NULL,
    "quote_number" VARCHAR(48) NOT NULL,
    "client_name" VARCHAR(200) NOT NULL,
    "client_email" VARCHAR(320) NOT NULL DEFAULT '',
    "shipping_address" VARCHAR(500) NOT NULL DEFAULT '',
    "invoice_date" VARCHAR(10) NOT NULL,
    "valid_until" VARCHAR(10) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "payment_notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "b2b_quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "b2b_quotes_quote_number_key" ON "public"."b2b_quotes"("quote_number");
CREATE INDEX IF NOT EXISTS "idx_b2b_quotes_status_updated" ON "public"."b2b_quotes"("status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_b2b_quotes_updated_at" ON "public"."b2b_quotes"("updated_at");

CREATE TABLE IF NOT EXISTS "public"."b2b_quote_items" (
    "id" BIGSERIAL NOT NULL,
    "quote_id" BIGINT NOT NULL,
    "strain_name" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,4) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "b2b_quote_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "b2b_quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "public"."b2b_quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "idx_b2b_quote_items_quote_id" ON "public"."b2b_quote_items"("quote_id");
