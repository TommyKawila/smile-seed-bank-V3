-- Wholesale SGF deposit reservations (not shop cart orders)

CREATE TABLE "public"."wholesale_deposit_yearly_seq" (
    "year" VARCHAR(4) NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wholesale_deposit_yearly_seq_pkey" PRIMARY KEY ("year")
);

CREATE TABLE "public"."wholesale_deposit_orders" (
    "id" BIGSERIAL NOT NULL,
    "reservation_number" VARCHAR(48) NOT NULL,
    "company_name" VARCHAR(200) NOT NULL,
    "contact_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(40) NOT NULL,
    "address" VARCHAR(1000) NOT NULL,
    "license_status" VARCHAR(20),
    "license_number" VARCHAR(100),
    "message" TEXT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'THB',
    "seed_total_thb" DECIMAL(12,2) NOT NULL,
    "extra_coa_thb" DECIMAL(12,2) NOT NULL,
    "grand_total_thb" DECIMAL(12,2) NOT NULL,
    "deposit_thb" DECIMAL(12,2) NOT NULL,
    "balance_thb" DECIMAL(12,2) NOT NULL,
    "coa_mode" VARCHAR(8) NOT NULL,
    "package_a_count" INTEGER NOT NULL DEFAULT 0,
    "package_b_count" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING_TRANSFER',
    "slip_url" TEXT,
    "slip_path" TEXT,
    "transfer_amount_thb" DECIMAL(12,2),
    "transferred_at" TIMESTAMPTZ(6),
    "payer_name" VARCHAR(200),
    "admin_note" TEXT,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wholesale_deposit_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wholesale_deposit_orders_reservation_number_key"
    ON "public"."wholesale_deposit_orders" ("reservation_number");

CREATE INDEX "idx_wholesale_deposit_orders_status"
    ON "public"."wholesale_deposit_orders" ("status", "updated_at");

CREATE TABLE "public"."wholesale_deposit_order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "variety_code" VARCHAR(32) NOT NULL,
    "strain_name" VARCHAR(200) NOT NULL,
    "fulfillment_tier" VARCHAR(24) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_thb" DECIMAL(12,4) NOT NULL,
    "line_total_thb" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "wholesale_deposit_order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_wholesale_deposit_order_items_order_id"
    ON "public"."wholesale_deposit_order_items" ("order_id");

ALTER TABLE "public"."wholesale_deposit_order_items"
    ADD CONSTRAINT "wholesale_deposit_order_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "public"."wholesale_deposit_orders"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
