use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Module {
    pub id: uuid::Uuid,
    pub component_description: Option<String>,
    pub component_name: String,
    pub description: String,
    pub old_id: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateModule {
    pub component_description: Option<String>,
    pub component_name: String,
    pub description: String,
}
