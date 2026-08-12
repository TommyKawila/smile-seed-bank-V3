-- Attachments for business document letters (inline in PDF/email)

ALTER TABLE "public"."business_documents"
ADD COLUMN IF NOT EXISTS "attachment_image_urls" JSONB NOT NULL DEFAULT '[]'::jsonb;
