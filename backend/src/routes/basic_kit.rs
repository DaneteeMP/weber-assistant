use axum::{extract::State, Json};
use sqlx::PgPool;

use crate::models::basic_kit::BasicKit;

pub async fn list_basic_kit(
    State(db): State<PgPool>,
) -> Result<Json<Vec<BasicKit>>, (axum::http::StatusCode, Json<serde_json::Value>)> {
    let rows = sqlx::query_as::<_, BasicKit>("SELECT * FROM basic_kit ORDER BY model")
        .fetch_all(&db)
        .await
        .map_err(|e| {
            (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;
    Ok(Json(rows))
}
