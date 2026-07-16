use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Distance {
    pub id: uuid::Uuid,
    pub km: Option<f64>,
    pub province: String,
    pub trip_hours: Option<f64>,
    pub old_id: Option<i32>,
    pub created_at: DateTime<Utc>,
}
