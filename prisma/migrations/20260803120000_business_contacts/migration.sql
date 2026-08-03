CREATE TABLE IF NOT EXISTS "public"."business_contacts" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL DEFAULT '',
    "email" VARCHAR(320) NOT NULL,
    "last_subject" VARCHAR(300) NOT NULL DEFAULT '',
    "last_contacted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_contacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "business_contacts_email_key"
  ON "public"."business_contacts"("email");

CREATE INDEX IF NOT EXISTS "idx_business_contacts_last_contacted"
  ON "public"."business_contacts"("last_contacted_at");
