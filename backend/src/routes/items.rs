use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::item::{CreateItem, Item, UpdateItem};

pub async fn list_items(
    State(db): State<PgPool>,
) -> Result<Json<Vec<Item>>, (StatusCode, Json<Value>)> {
    let items = sqlx::query_as::<_, Item>("SELECT * FROM items ORDER BY created_at DESC")
        .fetch_all(&db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        })?;

    Ok(Json(items))
}

pub async fn create_item(
    State(db): State<PgPool>,
    Json(payload): Json<CreateItem>,
) -> Result<(StatusCode, Json<Item>), (StatusCode, Json<Value>)> {
    let status = payload.status.unwrap_or_else(|| "active".to_string());

    let item = sqlx::query_as::<_, Item>(
        "INSERT INTO items (name, description, status) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&status)
    .fetch_one(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    Ok((StatusCode::CREATED, Json(item)))
}

pub async fn get_item(
    State(db): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Item>, (StatusCode, Json<Value>)> {
    let item = sqlx::query_as::<_, Item>("SELECT * FROM items WHERE id = $1")
        .bind(id)
        .fetch_optional(&db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        })?;

    match item {
        Some(item) => Ok(Json(item)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Item not found" })),
        )),
    }
}

pub async fn update_item(
    State(db): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateItem>,
) -> Result<Json<Item>, (StatusCode, Json<Value>)> {
    let existing = sqlx::query_as::<_, Item>("SELECT * FROM items WHERE id = $1")
        .bind(id)
        .fetch_optional(&db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        })?;

    let existing = match existing {
        Some(item) => item,
        None => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "Item not found" })),
            ));
        }
    };

    let name = payload.name.unwrap_or(existing.name);
    let description = payload.description.or(existing.description);
    let status = payload.status.unwrap_or(existing.status);

    let item = sqlx::query_as::<_, Item>(
        "UPDATE items SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *",
    )
    .bind(&name)
    .bind(&description)
    .bind(&status)
    .bind(id)
    .fetch_one(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(item))
}

pub async fn delete_item(
    State(db): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    let result = sqlx::query("DELETE FROM items WHERE id = $1")
        .bind(id)
        .execute(&db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Item not found" })),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}
