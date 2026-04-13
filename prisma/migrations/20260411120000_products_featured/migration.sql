ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "featured_priority" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "products_featured_list_idx" ON "public"."products" ("is_featured", "featured_priority") WHERE "is_featured" = true;
