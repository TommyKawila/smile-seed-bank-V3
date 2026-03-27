-- Add customer_name, customer_phone, customer_note for manual orders (POS)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_note TEXT;

-- Add unit_label to order_items for pack size display
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_label TEXT;
