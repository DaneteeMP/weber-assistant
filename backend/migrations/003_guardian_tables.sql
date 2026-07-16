CREATE TABLE IF NOT EXISTS clients_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    equipment VARCHAR(100) NOT NULL,
    id_guardian_offer VARCHAR(50),
    import_amount DOUBLE PRECISION,
    row_guardian INTEGER,
    workload DOUBLE PRECISION,
    old_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_equipment_customer ON clients_equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_clients_equipment_equipment ON clients_equipment(equipment);

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_description VARCHAR(255),
    component_name VARCHAR(255) NOT NULL,
    description VARCHAR(100) NOT NULL,
    old_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_description ON modules(description);
CREATE INDEX IF NOT EXISTS idx_modules_component_name ON modules(component_name);

CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_diet_rate DOUBLE PRECISION,
    half_diet_rate DOUBLE PRECISION,
    hotel_rate DOUBLE PRECISION,
    hourly_rate_specialist DOUBLE PRECISION,
    hourly_rate_technician DOUBLE PRECISION,
    km_rate DOUBLE PRECISION,
    year_price INTEGER,
    guardian_blades_discount DOUBLE PRECISION,
    guardian_spare_parts_discount DOUBLE PRECISION,
    guardian_technician_discount DOUBLE PRECISION,
    old_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_guardian_offer VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(20) NOT NULL,
    account_name VARCHAR(255),
    date_guardian DATE,
    status VARCHAR(50) DEFAULT 'Draft',
    responsible_person VARCHAR(255),
    equipment_plate VARCHAR(100),
    inspection_frequency VARCHAR(50),
    language VARCHAR(50),
    diets DOUBLE PRECISION DEFAULT 0,
    hotel_nights INTEGER DEFAULT 0,
    trip DOUBLE PRECISION DEFAULT 0,
    trip_hours DOUBLE PRECISION DEFAULT 0,
    work_hours DOUBLE PRECISION DEFAULT 0,
    total_hours DOUBLE PRECISION DEFAULT 0,
    basic_kit BOOLEAN DEFAULT FALSE,
    basic_kit_hours DOUBLE PRECISION DEFAULT 0,
    basic_kit_price DOUBLE PRECISION DEFAULT 0,
    discount DOUBLE PRECISION DEFAULT 0,
    hours_import DOUBLE PRECISION DEFAULT 0,
    report_hours DOUBLE PRECISION DEFAULT 0,
    total DOUBLE PRECISION DEFAULT 0,
    total_end DOUBLE PRECISION DEFAULT 0,
    general_comments TEXT,
    summary_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_customer ON offers(customer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

CREATE TABLE IF NOT EXISTS offer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    customer_id VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    equipment VARCHAR(100) NOT NULL,
    import_amount DOUBLE PRECISION,
    workload DOUBLE PRECISION,
    row_guardian INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_items_offer ON offer_items(offer_id);
