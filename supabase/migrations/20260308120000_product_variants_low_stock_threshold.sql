ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
