use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ClientEquipment {
    pub id: uuid::Uuid,
    pub customer_id: String,
    pub description: String,
    pub equipment: String,
    pub id_guardian_offer: Option<String>,
    pub import_amount: Option<f64>,
    pub row_guardian: Option<i32>,
    pub workload: Option<f64>,
    pub old_id: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ClientSummary {
    pub customer_id: String,
    pub equipment_count: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateClientEquipment {
    pub customer_id: String,
    pub description: String,
    pub equipment: String,
    pub id_guardian_offer: Option<String>,
    pub import_amount: Option<f64>,
    pub row_guardian: Option<i32>,
    pub workload: Option<f64>,
}
