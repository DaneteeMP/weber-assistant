CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_address VARCHAR(255),
    account_city VARCHAR(100),
    account_province VARCHAR(100),
    account_country VARCHAR(50),
    zip_code VARCHAR(20),
    plant VARCHAR(100),
    sales_man VARCHAR(255),
    sector VARCHAR(100),
    type VARCHAR(50),
    subsidiary VARCHAR(255),
    old_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_account_name ON customers(account_name);
