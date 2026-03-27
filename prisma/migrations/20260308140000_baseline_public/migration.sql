-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CustomerTier" AS ENUM ('Retail', 'Wholesale', 'VIP');

-- CreateEnum
CREATE TYPE "PromotionRuleType" AS ENUM ('DISCOUNT', 'BUY_X_GET_Y', 'FREEBIES', 'BUNDLE');

-- CreateTable
CREATE TABLE "blogs" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "title_en" TEXT,
    "excerpt" TEXT,
    "excerpt_en" TEXT,
    "content" TEXT,
    "content_en" TEXT,
    "image_url" TEXT,
    "category" TEXT,
    "view_count" INTEGER DEFAULT 0,
    "is_published" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSON,
    "excerpt" TEXT,
    "featured_image" TEXT,
    "author_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ(6),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "related_products" BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breeders" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "description_en" TEXT,
    "summary_en" TEXT,
    "summary_th" TEXT,
    "origin_th" TEXT,
    "origin_en" TEXT,
    "specialty_th" TEXT,
    "specialty_en" TEXT,
    "reputation_th" TEXT,
    "reputation_en" TEXT,
    "focus_th" TEXT,
    "focus_en" TEXT,
    "highlight_origin_th" TEXT,
    "highlight_origin_en" TEXT,
    "highlight_specialty_th" TEXT,
    "highlight_specialty_en" TEXT,
    "highlight_reputation_th" TEXT,
    "highlight_reputation_en" TEXT,
    "highlight_focus_th" TEXT,
    "highlight_focus_en" TEXT,
    "allowed_packages" JSONB DEFAULT '[1, 2, 3, 5]',

    CONSTRAINT "breeders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" SERIAL NOT NULL,
    "coupon_id" BIGINT,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "order_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "line_user_id" TEXT,
    "is_wholesale" BOOLEAN DEFAULT false,
    "wholesale_discount_percent" DECIMAL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line_id" TEXT,
    "tier" "CustomerTier" NOT NULL DEFAULT 'Retail',
    "wholesale_discount_percent" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "total_spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "preference" TEXT,
    "notes" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_tiers" (
    "id" BIGSERIAL NOT NULL,
    "min_amount" DECIMAL NOT NULL,
    "discount_percentage" DECIMAL NOT NULL,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "discount_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT,
    "product_id" BIGINT,
    "variant_id" BIGINT,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "total_price" DECIMAL(12,2),
    "subtotal" DECIMAL(12,2),
    "unit_label" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_number" VARCHAR(6) NOT NULL,
    "customer_id" UUID,
    "customer_profile_id" BIGINT,
    "order_origin" TEXT DEFAULT 'WEB',
    "payment_method" TEXT,
    "total_amount" DECIMAL NOT NULL,
    "total_cost" DECIMAL DEFAULT 0,
    "points_redeemed" INTEGER NOT NULL DEFAULT 0,
    "points_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "promotion_rule_id" BIGINT,
    "promotion_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT DEFAULT 'PENDING',
    "void_reason" TEXT,
    "tracking_number" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "shipping_address" TEXT,
    "slip_url" TEXT,
    "reject_note" TEXT,
    "shipping_provider" TEXT,
    "customer_name" TEXT,
    "customer_note" TEXT,
    "customer_phone" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "bank_accounts" JSONB DEFAULT '[]',
    "prompt_pay" JSONB DEFAULT '{}',
    "crypto_wallets" JSONB DEFAULT '[]',
    "line_id" TEXT DEFAULT '',
    "messenger_url" TEXT DEFAULT '',
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT,
    "unit_label" TEXT NOT NULL,
    "cost_price" DECIMAL DEFAULT 0,
    "price" DECIMAL NOT NULL,
    "stock" INTEGER DEFAULT 0,
    "low_stock_threshold" INTEGER DEFAULT 5,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "sku" TEXT,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "snapshot_date" TIMESTAMPTZ(6) NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_value" DECIMAL(12,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER DEFAULT 0,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "breeder_id" BIGINT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description_th" TEXT,
    "description_en" TEXT,
    "price" DECIMAL DEFAULT 0,
    "stock" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "image_url" TEXT,
    "image_url_2" TEXT,
    "image_url_3" TEXT,
    "video_url" TEXT,
    "thc_percent" DECIMAL,
    "cbd_percent" DECIMAL,
    "genetics" TEXT,
    "indica_ratio" DECIMAL,
    "sativa_ratio" DECIMAL,
    "flowering_type" TEXT,
    "seed_type" TEXT,
    "yield_info" TEXT,
    "growing_difficulty" TEXT,
    "effects" JSONB DEFAULT '[]',
    "flavors" JSONB DEFAULT '[]',
    "medical_benefits" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "genetic_ratio" TEXT,
    "sex_type" TEXT,
    "lineage" TEXT,
    "terpenes" JSONB,
    "image_url_4" TEXT,
    "image_url_5" TEXT,
    "image_urls" JSONB DEFAULT '[]',
    "master_sku" TEXT,
    "category_id" BIGINT,
    "strain_dominance" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_code_usages" (
    "id" BIGSERIAL NOT NULL,
    "promo_code_id" BIGINT,
    "order_id" BIGINT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "used_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_code_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" TEXT,
    "discount_value" DECIMAL,
    "min_spend" DECIMAL DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "expiry_date" TIMESTAMPTZ(6),
    "usage_limit_per_user" INTEGER DEFAULT 1,
    "total_usage_limit" INTEGER DEFAULT 100,
    "first_order_only" BOOLEAN DEFAULT false,
    "requires_auth" BOOLEAN DEFAULT false,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "condition_type" TEXT,
    "condition_value" TEXT,
    "reward_variant_id" BIGINT,
    "reward_quantity" INTEGER DEFAULT 1,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_rules" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PromotionRuleType" NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "discount_value" DECIMAL(12,2),

    CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_rules" (
    "id" BIGSERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "base_fee" DECIMAL DEFAULT 0,
    "free_shipping_threshold" DECIMAL,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "shipping_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "quotation_daily_seq" (
    "date" VARCHAR(8) NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quotation_daily_seq_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" BIGSERIAL NOT NULL,
    "quotation_number" VARCHAR(48) NOT NULL,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "customer_note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "valid_until" DATE,
    "converted_order_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" BIGSERIAL NOT NULL,
    "quotation_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "product_name" TEXT NOT NULL,
    "unit_label" TEXT,
    "breeder_name" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "store_name" TEXT DEFAULT 'Smile Seed Bank',
    "logo_url" TEXT,
    "contact_email" TEXT,
    "support_phone" TEXT,
    "address" TEXT,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "stock_snapshots_snapshot_date_variant_id_key" ON "stock_snapshots"("snapshot_date", "variant_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "idx_quotation_items_quotation_id" ON "quotation_items"("quotation_id");

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_profile_id_fkey" FOREIGN KEY ("customer_profile_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_breeder_id_fkey" FOREIGN KEY ("breeder_id") REFERENCES "breeders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promo_code_usages" ADD CONSTRAINT "promo_code_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promo_code_usages" ADD CONSTRAINT "promo_code_usages_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_reward_variant_id_fkey" FOREIGN KEY ("reward_variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
