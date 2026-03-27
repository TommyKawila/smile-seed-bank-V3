-- Add is_active for soft delete (Customer model)
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
