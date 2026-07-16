use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::client_equipment::ClientEquipment;
use crate::models::customer::{Customer, CustomerWithEquipment};

#[derive(Deserialize)]
pub struct ClientQuery {
    pub search: Option<String>,
    pub country: Option<String>,
}

pub async fn list_clients(
    State(db): State<PgPool>,
    Query(params): Query<ClientQuery>,
) -> Result<Json<Vec<CustomerWithEquipment>>, (StatusCode, Json<Value>)> {
    let mut query = String::from(
        "SELECT c.id, c.customer_id, c.account_name, c.account_address, c.account_city, c.account_province, c.account_country, c.sector, c.subsidiary, COUNT(ce.id) as equipment_count
         FROM customers c
         LEFT JOIN clients_equipment ce ON c.customer_id = ce.customer_id"
    );

    let mut conditions = Vec::new();

    if let Some(ref search) = params.search {
        conditions.push(format!(
            "(c.customer_id ILIKE '%{}%' OR c.account_name ILIKE '%{}%')",
            search, search
        ));
    }
    if let Some(ref country) = params.country {
        conditions.push(format!("c.subsidiary = '{}'", country));
    }

    if !conditions.is_empty() {
        query.push_str(" WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    query.push_str(" GROUP BY c.id, c.customer_id, c.account_name, c.account_address, c.account_city, c.account_country, c.sector, c.subsidiary ORDER BY c.account_name");

    let rows = sqlx::query_as::<_, CustomerWithEquipment>(&query)
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

pub async fn get_client(
    State(db): State<PgPool>,
    Path(customer_id): Path<String>,
) -> Result<Json<Customer>, (StatusCode, Json<Value>)> {
    let row = sqlx::query_as::<_, Customer>(
        "SELECT * FROM customers WHERE customer_id = $1",
    )
    .bind(&customer_id)
    .fetch_optional(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    match row {
        Some(c) => Ok(Json(c)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Customer not found" })),
        )),
    }
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

pub async fn list_subsidiaries(
    State(db): State<PgPool>,
) -> Result<Json<Vec<String>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, (String,)>(
        "SELECT DISTINCT subsidiary FROM customers WHERE subsidiary IS NOT NULL AND subsidiary != '' ORDER BY subsidiary",
    )
    .fetch_all(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(rows.into_iter().map(|(s,)| s).collect()))
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
