use axum::{extract::State, Json};
use serde::Serialize;
use sqlx::PgPool;

#[derive(Serialize)]
pub struct DashboardStats {
    pub total_customers: i64,
    pub total_equipment: i64,
    pub total_modules: i64,
    pub total_offers: i64,
    pub countries: Vec<CountryCount>,
}

#[derive(Serialize)]
pub struct CountryCount {
    pub country: String,
    pub count: i64,
}

pub async fn get_dashboard(State(db): State<PgPool>) -> Result<Json<DashboardStats>, (axum::http::StatusCode, String)> {
    let total_customers: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM customers")
        .fetch_one(&db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_equipment: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM equipment")
        .fetch_one(&db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_modules: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM clients_equipment")
        .fetch_one(&db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_offers: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM offers")
        .fetch_one(&db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let countries = sqlx::query_as::<_, (String, i64)>(
        "SELECT subsidiary, COUNT(*) FROM customers WHERE subsidiary IS NOT NULL AND subsidiary != '' GROUP BY subsidiary ORDER BY count DESC",
    )
    .fetch_all(&db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .into_iter()
    .map(|(country, count)| CountryCount { country, count })
    .collect();

    Ok(Json(DashboardStats {
        total_customers: total_customers.0,
        total_equipment: total_equipment.0,
        total_modules: total_modules.0,
        total_offers: total_offers.0,
        countries,
    }))
}
