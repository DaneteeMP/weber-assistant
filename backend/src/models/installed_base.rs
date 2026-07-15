use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct InstalledBase {
    pub id: uuid::Uuid,
    pub sap_debitor_id: String,
    pub parent_account_name: Option<String>,
    pub account_name: String,
    pub equipment_name: String,
    pub component_type: String,
    pub component_name: String,
    pub purchase_date: Option<chrono::NaiveDate>,
    pub parent_equipment_name: Option<String>,
    pub machine_type: String,
    pub physical_country: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
