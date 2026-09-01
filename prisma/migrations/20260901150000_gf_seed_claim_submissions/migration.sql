-- GF seed viability claim submissions (Smile intake before GF form)

CREATE TABLE "public"."gf_seed_claim_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gf_seed_claim_submissions_pkey" PRIMARY KEY ("id")
);
