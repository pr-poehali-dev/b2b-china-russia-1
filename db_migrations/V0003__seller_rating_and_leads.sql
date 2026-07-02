ALTER TABLE t_p93404869_b2b_china_russia_1.sellers
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

INSERT INTO t_p93404869_b2b_china_russia_1.leads (seller_id, buyer_name, buyer_contact, message, status)
SELECT 1, 'Тест', 'test@test.com', 'Тестовая заявка', 'Новая'
WHERE EXISTS (SELECT 1 FROM t_p93404869_b2b_china_russia_1.sellers WHERE id = 1)
AND NOT EXISTS (SELECT 1 FROM t_p93404869_b2b_china_russia_1.leads LIMIT 1);