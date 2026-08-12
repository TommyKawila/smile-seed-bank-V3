-- Label mockup composites (Green Future admin tool + public share links)

CREATE TABLE "public"."label_mockups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "species" TEXT NOT NULL,
    "strain_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "germination" DOUBLE PRECISION NOT NULL,
    "collected_date" TEXT NOT NULL DEFAULT '',
    "tested_date" TEXT NOT NULL DEFAULT '',
    "expiry_date" TEXT NOT NULL DEFAULT '',
    "producer_name" TEXT NOT NULL DEFAULT '',
    "producer_license_rp2" TEXT NOT NULL DEFAULT '',
    "distributor_name" TEXT NOT NULL DEFAULT '',
    "distributor_license_pp3" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "storage_instructions" TEXT NOT NULL,
    "bg_image_url" TEXT,
    "label_position" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "label_mockups_pkey" PRIMARY KEY ("id")
);
