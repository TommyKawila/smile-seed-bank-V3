-- Add strain_dominance to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS strain_dominance TEXT;
