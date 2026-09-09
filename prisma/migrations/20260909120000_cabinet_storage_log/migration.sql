-- Seed storage cabinet temp/RH log + GF share token

CREATE TABLE "public"."cabinet_storage_log_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "logged_at" TIMESTAMPTZ(6) NOT NULL,
    "temp_c" DECIMAL(5,2) NOT NULL,
    "rh_pct" DECIMAL(5,2) NOT NULL,
    "photo_path" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cabinet_storage_log_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cabinet_storage_log_entries_logged_at_idx"
    ON "public"."cabinet_storage_log_entries" ("logged_at" DESC);

CREATE TABLE "public"."cabinet_storage_share" (
    "singleton_key" VARCHAR(16) NOT NULL DEFAULT 'gf',
    "token" VARCHAR(128) NOT NULL,
    "rotated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cabinet_storage_share_pkey" PRIMARY KEY ("singleton_key")
);

CREATE UNIQUE INDEX "cabinet_storage_share_token_key"
    ON "public"."cabinet_storage_share" ("token");
