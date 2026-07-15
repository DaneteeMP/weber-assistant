use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Price {
    pub id: uuid::Uuid,
    pub full_diet_rate: Option<f64>,
    pub half_diet_rate: Option<f64>,
    pub hotel_rate: Option<f64>,
    pub hourly_rate_specialist: Option<f64>,
    pub hourly_rate_technician: Option<f64>,
    pub km_rate: Option<f64>,
    pub year_price: Option<i32>,
    pub guardian_blades_discount: Option<f64>,
    pub guardian_spare_parts_discount: Option<f64>,
    pub guardian_technician_discount: Option<f64>,
    pub old_id: Option<i32>,
    pub created_at: DateTime<Utc>,
}
