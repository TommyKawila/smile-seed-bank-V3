-- Add slip_url to orders for payment slip storage
ALTER TABLE orders ADD COLUMN IF NOT EXISTS slip_url TEXT;

-- payment-slips bucket for transfer slip uploads (run in Supabase SQL if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;
