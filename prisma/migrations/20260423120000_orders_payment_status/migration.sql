-- payment_status: unpaid | paid — separates payment confirmation from fulfillment (status)
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "payment_status" TEXT NOT NULL DEFAULT 'unpaid';

-- Mark paid for shipped/complete/legacy paid
UPDATE "public"."orders"
SET "payment_status" = 'paid'
WHERE "status" IN ('PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED');

-- Legacy PAID = paid + waiting to ship: becomes PENDING + paid
UPDATE "public"."orders"
SET "status" = 'PENDING'
WHERE "status" = 'PAID';
