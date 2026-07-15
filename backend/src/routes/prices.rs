use axum::{extract::State, Json};
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::price::Price;

pub async fn get_prices(
    State(db): State<PgPool>,
) -> Result<Json<Vec<Price>>, (axum::http::StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, Price>("SELECT * FROM prices ORDER BY year_price DESC")
        .fetch_all(&db)
        .await
        .map_err(|e| {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        })?;

    Ok(Json(rows))
}
