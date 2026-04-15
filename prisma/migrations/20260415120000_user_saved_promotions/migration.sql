-- AlterTable
ALTER TABLE "public"."promotion_campaigns" ADD COLUMN "save_to_profile" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."user_saved_promotions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "promotion_campaign_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saved_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_saved_promotions_user_id_idx" ON "public"."user_saved_promotions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_saved_promotions_user_id_promotion_campaign_id_key" ON "public"."user_saved_promotions"("user_id", "promotion_campaign_id");

-- AddForeignKey
ALTER TABLE "public"."user_saved_promotions" ADD CONSTRAINT "user_saved_promotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_saved_promotions" ADD CONSTRAINT "user_saved_promotions_promotion_campaign_id_fkey" FOREIGN KEY ("promotion_campaign_id") REFERENCES "public"."promotion_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
