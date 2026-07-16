CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(20) NOT NULL,
    configuration VARCHAR(100),
    description VARCHAR(255),
    material VARCHAR(255),
    model VARCHAR(100),
    serial VARCHAR(100),
    year INTEGER,
    old_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_customer ON equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_configuration ON equipment(configuration);
