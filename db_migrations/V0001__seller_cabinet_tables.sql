CREATE TABLE sellers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    province VARCHAR(100),
    category VARCHAR(100),
    plan VARCHAR(30) DEFAULT 'Verified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price VARCHAR(100),
    description TEXT,
    image_url TEXT,
    status VARCHAR(30) DEFAULT 'Активен',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id),
    product_id INTEGER REFERENCES products(id),
    buyer_name VARCHAR(255) NOT NULL,
    buyer_contact VARCHAR(255),
    message TEXT,
    status VARCHAR(30) DEFAULT 'Новая',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_leads_seller ON leads(seller_id);