-- Admin B2B business letters (drafts + sent history)
CREATE TABLE IF NOT EXISTS "public"."business_documents" (
    "id" BIGSERIAL NOT NULL,
    "subject" VARCHAR(300) NOT NULL,
    "body_text" TEXT NOT NULL,
    "recipient_name" VARCHAR(200) NOT NULL DEFAULT '',
    "recipient_email" VARCHAR(320) NOT NULL DEFAULT '',
    "brand_name" VARCHAR(120) NOT NULL DEFAULT '',
    "sender_name" VARCHAR(120) NOT NULL DEFAULT '',
    "document_date" VARCHAR(10) NOT NULL,
    "signature_image_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_business_documents_status_updated"
  ON "public"."business_documents" ("status", "updated_at");

CREATE INDEX IF NOT EXISTS "idx_business_documents_updated_at"
  ON "public"."business_documents" ("updated_at");
