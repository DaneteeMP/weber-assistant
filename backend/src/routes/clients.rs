use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::client_equipment::{ClientEquipment, ClientSummary};

#[derive(Deserialize)]
pub struct ClientQuery {
    pub search: Option<String>,
}

pub async fn list_clients(
    State(db): State<PgPool>,
    Query(params): Query<ClientQuery>,
) -> Result<Json<Vec<ClientSummary>>, (StatusCode, Json<Value>)> {
    let mut query = String::from(
        "SELECT customer_id, COUNT(*) as equipment_count FROM clients_equipment"
    );

    if let Some(ref search) = params.search {
        query.push_str(&format!(" WHERE customer_id ILIKE '%{}%'", search));
    }

    query.push_str(" GROUP BY customer_id ORDER BY customer_id");

    let rows = sqlx::query_as::<_, ClientSummary>(&query)
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

pub async fn get_client_equipment(
    State(db): State<PgPool>,
    Path(customer_id): Path<String>,
) -> Result<Json<Vec<ClientEquipment>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, ClientEquipment>(
        "SELECT * FROM clients_equipment WHERE customer_id = $1 ORDER BY equipment, description",
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
    Query(params): Query<ClientQuery>,
) -> Result<Json<Vec<ClientEquipment>>, (StatusCode, Json<Value>)> {
    let search = params.search.unwrap_or_default();
    let rows = sqlx::query_as::<_, ClientEquipment>(
        "SELECT * FROM clients_equipment WHERE customer_id ILIKE $1 OR description ILIKE $1 OR equipment ILIKE $1 ORDER BY customer_id, equipment",
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
