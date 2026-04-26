-- Order customer notification tracking (reminder level + last send time)
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "notification_level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "last_notified_at" TIMESTAMPTZ(6);
