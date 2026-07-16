use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Equipment {
    pub id: uuid::Uuid,
    pub customer_id: String,
    pub configuration: Option<String>,
    pub description: Option<String>,
    pub material: Option<String>,
    pub model: Option<String>,
    pub serial: Option<String>,
    pub year: Option<i32>,
    pub old_id: Option<i32>,
    pub created_at: DateTime<Utc>,
}
