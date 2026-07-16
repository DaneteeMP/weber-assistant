use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::guardian_summary::GuardianSummary;

pub async fn list_by_customer(
    State(db): State<PgPool>,
    Path(customer_id): Path<String>,
) -> Result<Json<Vec<GuardianSummary>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, GuardianSummary>(
        "SELECT * FROM guardian_summary WHERE customer_id = $1 ORDER BY date_guardian DESC",
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

pub async fn get_one(
    State(db): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<GuardianSummary>, (StatusCode, Json<Value>)> {
    let row = sqlx::query_as::<_, GuardianSummary>(
        "SELECT * FROM guardian_summary WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    match row {
        Some(r) => Ok(Json(r)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Not found" })),
        )),
    }
}
