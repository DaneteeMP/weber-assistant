use axum::{extract::State, Json};
use sqlx::PgPool;

use crate::models::installed_base::InstalledBase;

pub async fn list_installed_base(
    State(db): State<PgPool>,
) -> Result<Json<Vec<InstalledBase>>, (axum::http::StatusCode, String)> {
    let rows = sqlx::query_as::<_, InstalledBase>(
        "SELECT id, sap_debitor_id, parent_account_name, account_name, equipment_name, component_type, component_name, purchase_date, parent_equipment_name, machine_type, physical_country, created_at FROM installed_base ORDER BY account_name, equipment_name"
    )
    .fetch_all(&db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(rows))
}

use axum::extract::Query;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct InstalledBaseQuery {
    pub country: Option<String>,
    pub machine_type: Option<String>,
    pub component_type: Option<String>,
    pub search: Option<String>,
}

pub async fn search_installed_base(
    State(db): State<PgPool>,
    Query(params): Query<InstalledBaseQuery>,
) -> Result<Json<Vec<InstalledBase>>, (axum::http::StatusCode, String)> {
    let mut query = String::from(
        "SELECT id, sap_debitor_id, parent_account_name, account_name, equipment_name, component_type, component_name, purchase_date, parent_equipment_name, machine_type, physical_country, created_at FROM installed_base WHERE 1=1"
    );

    if let Some(ref country) = params.country {
        query.push_str(&format!(" AND physical_country = '{}'", country));
    }
    if let Some(ref machine_type) = params.machine_type {
        query.push_str(&format!(" AND machine_type = '{}'", machine_type));
    }
    if let Some(ref component_type) = params.component_type {
        query.push_str(&format!(" AND component_type = '{}'", component_type));
    }
    if let Some(ref search) = params.search {
        query.push_str(&format!(
            " AND (account_name ILIKE '%{}%' OR equipment_name ILIKE '%{}%' OR component_name ILIKE '%{}%')",
            search, search, search
        ));
    }

    query.push_str(" ORDER BY account_name, equipment_name");

    let rows = sqlx::query_as::<_, InstalledBase>(&query)
        .fetch_all(&db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(rows))
}

#[derive(serde::Serialize)]
pub struct InstalledBaseStats {
    pub total_equipments: i64,
    pub total_accounts: i64,
    pub countries: Vec<CountryCount>,
    pub machine_types: Vec<MachineTypeCount>,
}

#[derive(serde::Serialize)]
pub struct CountryCount {
    pub country: String,
    pub count: i64,
}

#[derive(serde::Serialize)]
pub struct MachineTypeCount {
    pub machine_type: String,
    pub count: i64,
}

pub async fn get_installed_base_stats(
    State(db): State<PgPool>,
) -> Result<Json<InstalledBaseStats>, (axum::http::StatusCode, String)> {
    let total_equipments: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM installed_base")
        .fetch_one(&db)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_accounts: (i64,) =
        sqlx::query_as("SELECT COUNT(DISTINCT account_name) FROM installed_base")
            .fetch_one(&db)
            .await
            .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let countries = sqlx::query_as::<_, (String, i64)>(
        "SELECT physical_country, COUNT(*) as count FROM installed_base GROUP BY physical_country ORDER BY count DESC",
    )
    .fetch_all(&db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .into_iter()
    .map(|(country, count)| CountryCount { country, count })
    .collect();

    let machine_types = sqlx::query_as::<_, (String, i64)>(
        "SELECT machine_type, COUNT(*) as count FROM installed_base GROUP BY machine_type ORDER BY count DESC",
    )
    .fetch_all(&db)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .into_iter()
    .map(|(machine_type, count)| MachineTypeCount { machine_type, count })
    .collect();

    Ok(Json(InstalledBaseStats {
        total_equipments: total_equipments.0,
        total_accounts: total_accounts.0,
        countries,
        machine_types,
    }))
}
