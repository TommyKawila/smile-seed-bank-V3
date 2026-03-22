-- Add allowed_packages to breeders (JSON array of pack sizes: 1, 2, 3, 5)
ALTER TABLE breeders
ADD COLUMN IF NOT EXISTS allowed_packages JSONB DEFAULT '[1,2,3,5]'::jsonb;
