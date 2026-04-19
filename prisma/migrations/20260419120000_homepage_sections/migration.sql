-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label_th" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "homepage_sections_key_key" ON "homepage_sections"("key");

INSERT INTO "homepage_sections" ("id", "key", "label_th", "label_en", "sort_order", "is_active")
VALUES
  ('hpsec_hero', 'hero', 'แบนเนอร์หลัก', 'Hero', 0, true),
  ('hpsec_blog', 'blog', 'คลังความรู้ / บทความ', 'Blog / Insights', 1, true),
  ('hpsec_featured', 'featured', 'สินค้าแนะนำ', 'Featured products', 2, true),
  ('hpsec_breeders', 'breeders', 'แบรนด์ / Breeders', 'Breeders ribbon', 3, true),
  ('hpsec_trust', 'trust', 'จุดเด่นร้าน (3 คอลัมน์)', 'Trust highlights', 4, true),
  ('hpsec_new_strains', 'new_strains', 'สายพันธุ์มาใหม่', 'New arrivals grid', 5, true),
  ('hpsec_newsletter', 'newsletter', 'แบนเนอร์สมัครสมาชิก', 'Newsletter / sign-up', 6, true);
