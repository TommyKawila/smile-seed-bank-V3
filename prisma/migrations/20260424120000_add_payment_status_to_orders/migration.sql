-- payment_status: default pending; add column if missing; backfill paid; map legacy unpaid -> pending
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "payment_status" TEXT;

UPDATE "public"."orders" SET "payment_status" = 'pending' WHERE "payment_status" IS NULL;

UPDATE "public"."orders" SET "payment_status" = 'paid' WHERE "status" IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED');

UPDATE "public"."orders" SET "status" = 'PENDING' WHERE "status" = 'PAID';

UPDATE "public"."orders" SET "payment_status" = 'pending' WHERE "payment_status" = 'unpaid';

ALTER TABLE "public"."orders" ALTER COLUMN "payment_status" SET NOT NULL;
ALTER TABLE "public"."orders" ALTER COLUMN "payment_status" SET DEFAULT 'pending';
