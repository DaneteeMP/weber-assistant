use axum::{extract::State, Json};
use sqlx::PgPool;

use crate::models::workload::Workload;

pub async fn list_workload(
    State(db): State<PgPool>,
) -> Result<Json<Vec<Workload>>, (axum::http::StatusCode, Json<serde_json::Value>)> {
    let rows = sqlx::query_as::<_, Workload>("SELECT * FROM workload ORDER BY component_description")
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
