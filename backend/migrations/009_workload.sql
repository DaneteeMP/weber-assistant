CREATE TABLE IF NOT EXISTS workload (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_description VARCHAR(255) NOT NULL,
    workload DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workload_component ON workload(component_description);
