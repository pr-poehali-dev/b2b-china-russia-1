ALTER TABLE t_p93404869_b2b_china_russia_1.sellers
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS wechat VARCHAR(100),
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(100),
  ADD COLUMN IF NOT EXISTS telegram VARCHAR(100),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  ADD COLUMN IF NOT EXISTS employees VARCHAR(50);

CREATE TABLE IF NOT EXISTS t_p93404869_b2b_china_russia_1.certificates (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES t_p93404869_b2b_china_russia_1.sellers(id),
  name VARCHAR(255) NOT NULL,
  file_url TEXT,
  issued_by VARCHAR(255),
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p93404869_b2b_china_russia_1.media (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES t_p93404869_b2b_china_russia_1.sellers(id),
  type VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  caption VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p93404869_b2b_china_russia_1.premium_orders (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES t_p93404869_b2b_china_russia_1.sellers(id),
  plan VARCHAR(50) NOT NULL,
  price_usd INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_seller ON t_p93404869_b2b_china_russia_1.certificates(seller_id);
CREATE INDEX IF NOT EXISTS idx_media_seller ON t_p93404869_b2b_china_russia_1.media(seller_id);
CREATE INDEX IF NOT EXISTS idx_premium_seller ON t_p93404869_b2b_china_russia_1.premium_orders(seller_id);