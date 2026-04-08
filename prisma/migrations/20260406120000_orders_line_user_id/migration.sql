-- Claim order: link LINE OA user to order for tracking notifications
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "line_user_id" TEXT;
