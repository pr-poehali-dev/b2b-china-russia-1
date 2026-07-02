ALTER TABLE t_p93404869_b2b_china_russia_1.media
  ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES t_p93404869_b2b_china_russia_1.products(id),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_sec INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS t_p93404869_b2b_china_russia_1.video_likes (
  id SERIAL PRIMARY KEY,
  media_id INTEGER NOT NULL REFERENCES t_p93404869_b2b_china_russia_1.media(id),
  visitor_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(media_id, visitor_id)
);

CREATE TABLE IF NOT EXISTS t_p93404869_b2b_china_russia_1.video_views (
  id SERIAL PRIMARY KEY,
  media_id INTEGER NOT NULL REFERENCES t_p93404869_b2b_china_russia_1.media(id),
  seller_id INTEGER REFERENCES t_p93404869_b2b_china_russia_1.sellers(id),
  visitor_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_likes_media ON t_p93404869_b2b_china_russia_1.video_likes(media_id);
CREATE INDEX IF NOT EXISTS idx_video_views_media ON t_p93404869_b2b_china_russia_1.video_views(media_id);
CREATE INDEX IF NOT EXISTS idx_media_type_video ON t_p93404869_b2b_china_russia_1.media(type, created_at DESC);