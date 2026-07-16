CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE IF NOT EXISTS distances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    km DOUBLE PRECISION,
    province VARCHAR(100) NOT NULL,
    trip_hours DOUBLE PRECISION,
    old_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_distances_province ON distances(province);

CREATE TABLE IF NOT EXISTS guardian_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_guardian_offer VARCHAR(50) NOT NULL,
    date_guardian DATE,
    customer_id VARCHAR(20) NOT NULL,
    account_name VARCHAR(255),
    equipment VARCHAR(100),
    inspection_frequency VARCHAR(50),
    basic_kit BOOLEAN DEFAULT FALSE,
    total DOUBLE PRECISION,
    discount DOUBLE PRECISION,
    total_end DOUBLE PRECISION,
    basic_kit_price DOUBLE PRECISION,
    acceptance_date DATE,
    audit_amount DOUBLE PRECISION,
    audit_comments TEXT,
    audit_date DATE,
    audit_number_invoice VARCHAR(100),
    audit_report TEXT,
    maintenance_checklist_number VARCHAR(100),
    maintenance_comments TEXT,
    maintenance_date DATE,
    maintenance_sat_amount DOUBLE PRECISION,
    maintenance_service_invoice VARCHAR(100),
    maintenance_spare_parts_offer TEXT,
    maintenance_status VARCHAR(50),
    maintenance_sat_date DATE,
    spare_parts_date DATE,
    spare_parts_material_amount DOUBLE PRECISION,
    spare_parts_material_invoice VARCHAR(100),
    summary_notes TEXT,
    summary_other1 DOUBLE PRECISION,
    summary_other2 DOUBLE PRECISION,
    summary_total_euros DOUBLE PRECISION,
    status VARCHAR(50),
    bill_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guardian_summary_customer ON guardian_summary(customer_id);
CREATE INDEX IF NOT EXISTS idx_guardian_summary_offer ON guardian_summary(id_guardian_offer);
CREATE INDEX IF NOT EXISTS idx_guardian_summary_equipment ON guardian_summary(equipment);
CREATE INDEX IF NOT EXISTS idx_guardian_summary_status ON guardian_summary(status);

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

CREATE TABLE IF NOT EXISTS basic_kit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model VARCHAR(100) NOT NULL,
    spare_parts DOUBLE PRECISION,
    workload_basic_kit DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_basic_kit_model ON basic_kit(model);

CREATE TABLE IF NOT EXISTS workload (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_description VARCHAR(255) NOT NULL,
    workload DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workload_component ON workload(component_description);
