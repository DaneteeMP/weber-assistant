use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::models::offer::{CreateOffer, Offer, OfferItem, UpdateOffer};

pub async fn list_offers(
    State(db): State<PgPool>,
) -> Result<Json<Vec<Offer>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, Offer>(
        "SELECT * FROM offers ORDER BY created_at DESC",
    )
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

pub async fn list_offers_by_customer(
    State(db): State<PgPool>,
    Path(customer_id): Path<String>,
) -> Result<Json<Vec<Offer>>, (StatusCode, Json<Value>)> {
    let rows = sqlx::query_as::<_, Offer>(
        "SELECT * FROM offers WHERE customer_id = $1 ORDER BY date_guardian DESC",
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

pub async fn get_offer(
    State(db): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<(Offer, Vec<OfferItem>)>, (StatusCode, Json<Value>)> {
    let offer = sqlx::query_as::<_, Offer>("SELECT * FROM offers WHERE id = $1")
        .bind(id)
        .fetch_optional(&db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        })?;

    let offer = match offer {
        Some(o) => o,
        None => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "Offer not found" })),
            ));
        }
    };

    let items = sqlx::query_as::<_, OfferItem>(
        "SELECT * FROM offer_items WHERE offer_id = $1 ORDER BY row_guardian",
    )
    .bind(id)
    .fetch_all(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json((offer, items)))
}

pub async fn create_offer(
    State(db): State<PgPool>,
    Json(payload): Json<CreateOffer>,
) -> Result<(StatusCode, Json<Offer>), (StatusCode, Json<Value>)> {
    let status = payload.status.unwrap_or_else(|| "Draft".to_string());

    let offer = sqlx::query_as::<_, Offer>(
        "INSERT INTO offers (
            id_guardian_offer, customer_id, account_name, date_guardian, status,
            responsible_person, equipment_plate, inspection_frequency, language,
            diets, hotel_nights, trip, trip_hours, work_hours, total_hours,
            basic_kit, basic_kit_hours, basic_kit_price, discount,
            hours_import, report_hours, total, total_end,
            general_comments, summary_notes
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25
        ) RETURNING *",
    )
    .bind(&payload.id_guardian_offer)
    .bind(&payload.customer_id)
    .bind(&payload.account_name)
    .bind(payload.date_guardian)
    .bind(&status)
    .bind(&payload.responsible_person)
    .bind(&payload.equipment_plate)
    .bind(&payload.inspection_frequency)
    .bind(&payload.language)
    .bind(payload.diets.unwrap_or(0.0))
    .bind(payload.hotel_nights.unwrap_or(0))
    .bind(payload.trip.unwrap_or(0.0))
    .bind(payload.trip_hours.unwrap_or(0.0))
    .bind(payload.work_hours.unwrap_or(0.0))
    .bind(payload.total_hours.unwrap_or(0.0))
    .bind(payload.basic_kit.unwrap_or(false))
    .bind(payload.basic_kit_hours.unwrap_or(0.0))
    .bind(payload.basic_kit_price.unwrap_or(0.0))
    .bind(payload.discount.unwrap_or(0.0))
    .bind(payload.hours_import.unwrap_or(0.0))
    .bind(payload.report_hours.unwrap_or(0.0))
    .bind(payload.total.unwrap_or(0.0))
    .bind(payload.total_end.unwrap_or(0.0))
    .bind(&payload.general_comments)
    .bind(&payload.summary_notes)
    .fetch_one(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    if let Some(items) = payload.items {
        for item in items {
            sqlx::query(
                "INSERT INTO offer_items (offer_id, customer_id, description, equipment, import_amount, workload, row_guardian) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            )
            .bind(offer.id)
            .bind(&item.customer_id)
            .bind(&item.description)
            .bind(&item.equipment)
            .bind(item.import_amount)
            .bind(item.workload)
            .bind(item.row_guardian)
            .execute(&db)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": e.to_string() })),
                )
            })?;
        }
    }

    Ok((StatusCode::CREATED, Json(offer)))
}

pub async fn update_offer(
    State(db): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateOffer>,
) -> Result<Json<Offer>, (StatusCode, Json<Value>)> {
    let existing = sqlx::query_as::<_, Offer>("SELECT * FROM offers WHERE id = $1")
        .bind(id)
        .fetch_optional(&db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": e.to_string() })),
            )
        })?;

    if existing.is_none() {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Offer not found" })),
        ));
    }

    let offer = sqlx::query_as::<_, Offer>(
        "UPDATE offers SET
            account_name = COALESCE($1, account_name),
            date_guardian = COALESCE($2, date_guardian),
            status = COALESCE($3, status),
            responsible_person = COALESCE($4, responsible_person),
            equipment_plate = COALESCE($5, equipment_plate),
            inspection_frequency = COALESCE($6, inspection_frequency),
            language = COALESCE($7, language),
            diets = COALESCE($8, diets),
            hotel_nights = COALESCE($9, hotel_nights),
            trip = COALESCE($10, trip),
            trip_hours = COALESCE($11, trip_hours),
            work_hours = COALESCE($12, work_hours),
            total_hours = COALESCE($13, total_hours),
            basic_kit = COALESCE($14, basic_kit),
            basic_kit_hours = COALESCE($15, basic_kit_hours),
            basic_kit_price = COALESCE($16, basic_kit_price),
            discount = COALESCE($17, discount),
            hours_import = COALESCE($18, hours_import),
            report_hours = COALESCE($19, report_hours),
            total = COALESCE($20, total),
            total_end = COALESCE($21, total_end),
            general_comments = COALESCE($22, general_comments),
            summary_notes = COALESCE($23, summary_notes)
        WHERE id = $24 RETURNING *",
    )
    .bind(payload.account_name)
    .bind(payload.date_guardian)
    .bind(payload.status)
    .bind(payload.responsible_person)
    .bind(payload.equipment_plate)
    .bind(payload.inspection_frequency)
    .bind(payload.language)
    .bind(payload.diets)
    .bind(payload.hotel_nights)
    .bind(payload.trip)
    .bind(payload.trip_hours)
    .bind(payload.work_hours)
    .bind(payload.total_hours)
    .bind(payload.basic_kit)
    .bind(payload.basic_kit_hours)
    .bind(payload.basic_kit_price)
    .bind(payload.discount)
    .bind(payload.hours_import)
    .bind(payload.report_hours)
    .bind(payload.total)
    .bind(payload.total_end)
    .bind(payload.general_comments)
    .bind(payload.summary_notes)
    .bind(id)
    .fetch_one(&db)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )
    })?;

    Ok(Json(offer))
}

pub async fn delete_offer(
    State(db): State<PgPool>,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    let result = sqlx::query("DELETE FROM offers WHERE id = $1")
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
            Json(json!({ "error": "Offer not found" })),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}
