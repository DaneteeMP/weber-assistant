use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::module::Module;

#[derive(Deserialize)]
pub struct ModuleQuery {
    pub description: Option<String>,
}

pub async fn list_modules(
    State(db): State<PgPool>,
) -> Result<Json<Vec<Module>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, Module>("SELECT * FROM modules ORDER BY component_name")
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

pub async fn get_modules_by_equipment(
    State(db): State<PgPool>,
    Path(equipment): Path<String>,
) -> Result<Json<Vec<Module>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, Module>(
        "SELECT * FROM modules WHERE description = $1 ORDER BY component_name",
    )
    .bind(&equipment)
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

pub async fn search_modules(
    State(db): State<PgPool>,
    axum::extract::Query(params): axum::extract::Query<ModuleQuery>,
) -> Result<Json<Vec<Module>>, (StatusCode, Json<Value>)> {
    let search = params.description.unwrap_or_default();
    let rows = sqlx::query_as::<_, Module>(
        "SELECT * FROM modules WHERE component_name ILIKE $1 OR description ILIKE $1 ORDER BY component_name",
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
