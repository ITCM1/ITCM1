-- Digital product catalogue for owner-managed product creation and sales readiness.
CREATE TABLE IF NOT EXISTS digital_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 180),
  description TEXT NOT NULL DEFAULT '',
  target_market TEXT NOT NULL DEFAULT 'International',
  price_amount REAL NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'listed', 'archived')),
  sales_channel TEXT NOT NULL DEFAULT '',
  listing_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_digital_products_status_updated
  ON digital_products(status, updated_at DESC);
