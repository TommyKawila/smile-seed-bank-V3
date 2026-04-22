-- Order activity for admin audit (LINE manual + auto notifications)
CREATE TABLE IF NOT EXISTS "public"."order_logs" (
  "id" BIGSERIAL NOT NULL,
  "order_id" BIGINT NOT NULL,
  "action" VARCHAR(64) NOT NULL,
  "message_content" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "order_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX IF NOT EXISTS "order_logs_order_id_idx" ON "public"."order_logs" ("order_id");
CREATE INDEX IF NOT EXISTS "order_logs_created_at_idx" ON "public"."order_logs" ("created_at" DESC);
