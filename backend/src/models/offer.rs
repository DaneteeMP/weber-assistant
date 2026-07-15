use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Offer {
    pub id: uuid::Uuid,
    pub id_guardian_offer: String,
    pub customer_id: String,
    pub account_name: Option<String>,
    pub date_guardian: Option<NaiveDate>,
    pub status: Option<String>,
    pub responsible_person: Option<String>,
    pub equipment_plate: Option<String>,
    pub inspection_frequency: Option<String>,
    pub language: Option<String>,
    pub diets: Option<f64>,
    pub hotel_nights: Option<i32>,
    pub trip: Option<f64>,
    pub trip_hours: Option<f64>,
    pub work_hours: Option<f64>,
    pub total_hours: Option<f64>,
    pub basic_kit: Option<bool>,
    pub basic_kit_hours: Option<f64>,
    pub basic_kit_price: Option<f64>,
    pub discount: Option<f64>,
    pub hours_import: Option<f64>,
    pub report_hours: Option<f64>,
    pub total: Option<f64>,
    pub total_end: Option<f64>,
    pub general_comments: Option<String>,
    pub summary_notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct OfferItem {
    pub id: uuid::Uuid,
    pub offer_id: uuid::Uuid,
    pub customer_id: String,
    pub description: String,
    pub equipment: String,
    pub import_amount: Option<f64>,
    pub workload: Option<f64>,
    pub row_guardian: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOffer {
    pub id_guardian_offer: String,
    pub customer_id: String,
    pub account_name: Option<String>,
    pub date_guardian: Option<NaiveDate>,
    pub status: Option<String>,
    pub responsible_person: Option<String>,
    pub equipment_plate: Option<String>,
    pub inspection_frequency: Option<String>,
    pub language: Option<String>,
    pub diets: Option<f64>,
    pub hotel_nights: Option<i32>,
    pub trip: Option<f64>,
    pub trip_hours: Option<f64>,
    pub work_hours: Option<f64>,
    pub total_hours: Option<f64>,
    pub basic_kit: Option<bool>,
    pub basic_kit_hours: Option<f64>,
    pub basic_kit_price: Option<f64>,
    pub discount: Option<f64>,
    pub hours_import: Option<f64>,
    pub report_hours: Option<f64>,
    pub total: Option<f64>,
    pub total_end: Option<f64>,
    pub general_comments: Option<String>,
    pub summary_notes: Option<String>,
    pub items: Option<Vec<CreateOfferItem>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOfferItem {
    pub customer_id: String,
    pub description: String,
    pub equipment: String,
    pub import_amount: Option<f64>,
    pub workload: Option<f64>,
    pub row_guardian: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOffer {
    pub account_name: Option<String>,
    pub date_guardian: Option<NaiveDate>,
    pub status: Option<String>,
    pub responsible_person: Option<String>,
    pub equipment_plate: Option<String>,
    pub inspection_frequency: Option<String>,
    pub language: Option<String>,
    pub diets: Option<f64>,
    pub hotel_nights: Option<i32>,
    pub trip: Option<f64>,
    pub trip_hours: Option<f64>,
    pub work_hours: Option<f64>,
    pub total_hours: Option<f64>,
    pub basic_kit: Option<bool>,
    pub basic_kit_hours: Option<f64>,
    pub basic_kit_price: Option<f64>,
    pub discount: Option<f64>,
    pub hours_import: Option<f64>,
    pub report_hours: Option<f64>,
    pub total: Option<f64>,
    pub total_end: Option<f64>,
    pub general_comments: Option<String>,
    pub summary_notes: Option<String>,
}
