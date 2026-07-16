use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct BasicKit {
    pub id: Uuid,
    pub model: String,
    pub spare_parts: Option<f64>,
    pub workload_basic_kit: Option<f64>,
    pub created_at: DateTime<Utc>,
}
