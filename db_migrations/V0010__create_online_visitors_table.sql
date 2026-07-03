CREATE TABLE IF NOT EXISTS online_visitors (
    visitor_id VARCHAR(64) PRIMARY KEY,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_online_visitors_last_seen ON online_visitors (last_seen);
