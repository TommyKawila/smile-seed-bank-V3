-- Manual order customer claim: shipping fields + opaque token
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "shipping_name" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "shipping_phone" TEXT;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "claim_token" VARCHAR(48);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_claim_token_key" ON "public"."orders" ("claim_token");
