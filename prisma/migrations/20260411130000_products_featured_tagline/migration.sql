-- Optional highlight copy for storefront featured carousel cards
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "featured_tagline" TEXT;
