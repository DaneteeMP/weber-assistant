CREATE TABLE IF NOT EXISTS basic_kit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model VARCHAR(100) NOT NULL,
    spare_parts DOUBLE PRECISION,
    workload_basic_kit DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basic_kit_model ON basic_kit(model);
