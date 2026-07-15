CREATE TABLE IF NOT EXISTS installed_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sap_debitor_id VARCHAR(20) NOT NULL,
    parent_account_name VARCHAR(255),
    account_name VARCHAR(255) NOT NULL,
    equipment_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    component_name TEXT NOT NULL,
    purchase_date DATE,
    parent_equipment_name VARCHAR(100),
    machine_type VARCHAR(50) NOT NULL,
    physical_country VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_installed_base_country ON installed_base(physical_country);
CREATE INDEX IF NOT EXISTS idx_installed_base_machine_type ON installed_base(machine_type);
CREATE INDEX IF NOT EXISTS idx_installed_base_account ON installed_base(account_name);
CREATE INDEX IF NOT EXISTS idx_installed_base_component_type ON installed_base(component_type);
