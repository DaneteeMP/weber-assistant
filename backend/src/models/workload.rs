use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Workload {
    pub id: Uuid,
    pub component_description: String,
    pub workload: Option<f64>,
    pub created_at: DateTime<Utc>,
}
