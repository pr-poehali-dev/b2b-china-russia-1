-- Buyers (российские покупатели)
CREATE TABLE IF NOT EXISTS buyers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Избранное: компании, товары, видео
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id),
    item_type VARCHAR(20) NOT NULL,
    item_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(buyer_id, item_type, item_id)
);

-- История просмотров
CREATE TABLE IF NOT EXISTS view_history (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id),
    item_type VARCHAR(20) NOT NULL,
    item_id INTEGER NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(buyer_id, item_type, item_id)
);

-- Чаты покупатель <-> поставщик
CREATE TABLE IF NOT EXISTS buyer_chats (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id),
    seller_id INTEGER NOT NULL REFERENCES sellers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    buyer_unread INTEGER DEFAULT 0,
    seller_unread INTEGER DEFAULT 0,
    UNIQUE(buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS buyer_chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES buyer_chats(id),
    sender VARCHAR(10) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Уведомления покупателя
CREATE TABLE IF NOT EXISTS buyer_notifications (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id),
    type VARCHAR(30) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    seller_id INTEGER REFERENCES sellers(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь заявок (leads) с покупателем
ALTER TABLE leads ADD COLUMN IF NOT EXISTS buyer_id INTEGER REFERENCES buyers(id);
