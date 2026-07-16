use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: uuid::Uuid,
    pub customer_id: String,
    pub account_name: String,
    pub account_address: Option<String>,
    pub account_city: Option<String>,
    pub account_province: Option<String>,
    pub account_country: Option<String>,
    pub zip_code: Option<String>,
    pub plant: Option<String>,
    pub sales_man: Option<String>,
    pub sector: Option<String>,
    pub r#type: Option<String>,
    pub subsidiary: Option<String>,
    pub old_id: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct CustomerWithEquipment {
    pub id: uuid::Uuid,
    pub customer_id: String,
    pub account_name: String,
    pub account_address: Option<String>,
    pub account_city: Option<String>,
    pub account_province: Option<String>,
    pub account_country: Option<String>,
    pub sector: Option<String>,
    pub subsidiary: Option<String>,
    pub equipment_count: i64,
}
