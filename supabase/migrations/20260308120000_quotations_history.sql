CREATE TABLE IF NOT EXISTS public.quotations (
  id BIGSERIAL PRIMARY KEY,
  quotation_number VARCHAR(48) NOT NULL UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_note TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  total_amount NUMERIC(12, 2) NOT NULL,
  valid_until DATE,
  converted_order_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations (status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations (created_at DESC);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id BIGSERIAL PRIMARY KEY,
  quotation_id BIGINT NOT NULL REFERENCES public.quotations (id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  variant_id BIGINT NOT NULL,
  product_name TEXT NOT NULL,
  unit_label TEXT,
  breeder_name TEXT,
  quantity INT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items (quotation_id);
