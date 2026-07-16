CREATE TABLE IF NOT EXISTS distances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    km DOUBLE PRECISION,
    province VARCHAR(100) NOT NULL,
    trip_hours DOUBLE PRECISION,
    old_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distances_province ON distances(province);
