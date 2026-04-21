-- CreateTable
CREATE TABLE "public"."user_claimed_coupons" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "promo_code_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_claimed_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_claimed_coupons_user_id_idx" ON "public"."user_claimed_coupons"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_claimed_coupons_user_id_promo_code_id_key" ON "public"."user_claimed_coupons"("user_id", "promo_code_id");

-- AddForeignKey
ALTER TABLE "public"."user_claimed_coupons" ADD CONSTRAINT "user_claimed_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_claimed_coupons" ADD CONSTRAINT "user_claimed_coupons_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
