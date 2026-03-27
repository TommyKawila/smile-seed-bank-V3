CREATE TABLE IF NOT EXISTS stock_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_date TIMESTAMPTZ NOT NULL,
  variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  total_value DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(snapshot_date, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_snapshots_date ON stock_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_stock_snapshots_variant ON stock_snapshots(variant_id);
