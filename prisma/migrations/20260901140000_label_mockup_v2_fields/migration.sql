-- Label mockup V.2 — DOA mandatory fields (lot, trademark, collection source)

ALTER TABLE "public"."label_mockups"
  ADD COLUMN IF NOT EXISTS "lot_no" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "trademark" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "collection_source" TEXT NOT NULL DEFAULT '';
