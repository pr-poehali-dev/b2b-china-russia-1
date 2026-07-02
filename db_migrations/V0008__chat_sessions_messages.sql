CREATE TABLE t_p93404869_b2b_china_russia_1.chat_sessions (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(64) NOT NULL,
  visitor_name VARCHAR(100),
  visitor_email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE t_p93404869_b2b_china_russia_1.chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES t_p93404869_b2b_china_russia_1.chat_sessions(id),
  sender VARCHAR(10) NOT NULL,
  text TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_session ON t_p93404869_b2b_china_russia_1.chat_messages(session_id);
CREATE INDEX idx_chat_sessions_visitor ON t_p93404869_b2b_china_russia_1.chat_sessions(visitor_id);
CREATE INDEX idx_chat_sessions_last ON t_p93404869_b2b_china_russia_1.chat_sessions(last_message_at DESC);