-- Lock down cabinet storage log tables (created in 20260909120000 without RLS).
-- Pattern: ENABLE RLS, no anon/authenticated policies → PostgREST cannot dump
-- share tokens or forge GACP temp/RH evidence. Prisma / table-owner / service_role
-- continue to read/write via /api/admin/partners/green-future/storage-log.

ALTER TABLE "public"."cabinet_storage_log_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cabinet_storage_share" ENABLE ROW LEVEL SECURITY;
