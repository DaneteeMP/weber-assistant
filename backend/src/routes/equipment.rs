use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::equipment::Equipment;

#[derive(Deserialize)]
pub struct EquipmentQuery {
    pub search: Option<String>,
}

pub async fn get_equipment_by_customer(
    State(db): State<PgPool>,
    Path(customer_id): Path<String>,
) -> Result<Json<Vec<Equipment>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, Equipment>(
        "SELECT * FROM equipment WHERE customer_id = $1 ORDER BY configuration",
    )
    .bind(&customer_id)
    .fetch_all(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(rows))
}

pub async fn search_equipment(
    State(db): State<PgPool>,
    Query(params): Query<EquipmentQuery>,
) -> Result<Json<Vec<Equipment>>, (StatusCode, Json<Value>)> {
    let search = params.search.unwrap_or_default();
    let rows = sqlx::query_as::<_, Equipment>(
        "SELECT * FROM equipment WHERE customer_id ILIKE $1 OR description ILIKE $1 OR configuration ILIKE $1 OR serial ILIKE $1 ORDER BY customer_id",
    )
    .bind(format!("%{}%", search))
    .fetch_all(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(rows))
}
