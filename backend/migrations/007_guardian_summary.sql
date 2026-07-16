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
