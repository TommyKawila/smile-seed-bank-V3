-- Grower AI tools usage logging
CREATE TABLE "public"."grower_tool_usage_logs" (
    "id" BIGSERIAL NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "model" VARCHAR(32) NOT NULL DEFAULT '',
    "status" VARCHAR(24) NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost_usd" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "ip_hash" VARCHAR(64) NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grower_tool_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_grower_tool_usage_created_at" ON "public"."grower_tool_usage_logs"("created_at");
CREATE INDEX "idx_grower_tool_usage_action_created" ON "public"."grower_tool_usage_logs"("action", "created_at");
CREATE INDEX "idx_grower_tool_usage_status_created" ON "public"."grower_tool_usage_logs"("status", "created_at");
