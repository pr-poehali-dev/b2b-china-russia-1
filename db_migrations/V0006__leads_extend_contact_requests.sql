ALTER TABLE t_p93404869_b2b_china_russia_1.leads
  ADD COLUMN IF NOT EXISTS type VARCHAR(30) DEFAULT 'supplier',
  ADD COLUMN IF NOT EXISTS product_interest TEXT,
  ADD COLUMN IF NOT EXISTS budget VARCHAR(100),
  ADD COLUMN IF NOT EXISTS quantity VARCHAR(100);

CREATE TABLE IF NOT EXISTS t_p93404869_b2b_china_russia_1.contact_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  product_interest TEXT,
  budget VARCHAR(100),
  quantity VARCHAR(100),
  message TEXT,
  status VARCHAR(30) DEFAULT 'Новая',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);