use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::distance::Distance;

#[derive(Deserialize)]
pub struct DistanceQuery {
    pub search: Option<String>,
}

pub async fn list_distances(
    State(db): State<PgPool>,
) -> Result<Json<Vec<Distance>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, Distance>("SELECT * FROM distances ORDER BY province")
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

pub async fn search_distances(
    State(db): State<PgPool>,
    Query(params): Query<DistanceQuery>,
) -> Result<Json<Vec<Distance>>, (StatusCode, Json<Value>)> {
    let search = params.search.unwrap_or_default();
    let rows = sqlx::query_as::<_, Distance>(
        "SELECT * FROM distances WHERE province ILIKE $1 ORDER BY province",
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
