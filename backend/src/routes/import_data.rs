use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;

#[derive(Debug, Deserialize)]
pub struct ImportPayload {
    pub table: String,
    pub rows: Vec<Value>,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub table: String,
    pub inserted: usize,
    pub errors: Vec<String>,
}

pub async fn import_data(
    State(db): State<PgPool>,
    Json(payload): Json<ImportPayload>,
) -> Result<Json<ImportResult>, (axum::http::StatusCode, Json<Value>)> {
    let mut result = ImportResult {
        table: payload.table.clone(),
        inserted: 0,
        errors: vec![],
    };

    match payload.table.as_str() {
        "clients_equipment" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let customer_id = row["CustomerID"].as_str().unwrap_or("");
                let description = row["Description"].as_str().unwrap_or("");
                let equipment = row["Equipment"].as_str().unwrap_or("");
                let id_guardian_offer = row["IdGuardianOffer"].as_str().map(|s| s.to_string());
                let import_amount = parse_f64(row["Import"].as_str().unwrap_or("0"));
                let row_guardian = row["RowGuardian"].as_i64().map(|v| v as i32);
                let workload = parse_f64(row["WorkLoad"].as_str().unwrap_or("0"));
                let old_id = row["_OldID"].as_i64().map(|v| v as i32);

                if customer_id.is_empty() || description.is_empty() {
                    result.errors.push(format!("Row {}: missing required fields", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO clients_equipment (customer_id, description, equipment, id_guardian_offer, import_amount, row_guardian, workload, old_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                )
                .bind(customer_id)
                .bind(description)
                .bind(equipment)
                .bind(id_guardian_offer)
                .bind(import_amount)
                .bind(row_guardian)
                .bind(workload)
                .bind(old_id)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "modules" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let component_description = row["Component Description"].as_str().map(|s| s.to_string());
                let component_name = row["Component Name"].as_str().unwrap_or("");
                let description = row["Description"].as_str().unwrap_or("");
                let old_id = row["_OldID"].as_i64().map(|v| v as i32);

                if component_name.is_empty() {
                    result.errors.push(format!("Row {}: missing Component Name", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO modules (component_description, component_name, description, old_id) VALUES ($1, $2, $3, $4)",
                )
                .bind(component_description)
                .bind(component_name)
                .bind(description)
                .bind(old_id)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "prices" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let full_diet_rate = parse_f64(row["FullDietRate"].as_str().unwrap_or("0"));
                let half_diet_rate = parse_f64(row["HalfDietRate"].as_str().unwrap_or("0"));
                let hotel_rate = parse_f64(row["HotelRate"].as_str().unwrap_or("0"));
                let hourly_rate_specialist = parse_f64(row["HourlyRate Specialist"].as_str().unwrap_or("0"));
                let hourly_rate_technician = parse_f64(row["HourlyRate Technician"].as_str().unwrap_or("0"));
                let km_rate = parse_f64(row["KmRate"].as_str().unwrap_or("0"));
                let year_price = row["YearPrice"].as_i64().map(|v| v as i32);
                let guardian_blades_discount = parse_f64(row["GuardianBladesDiscount"].as_str().unwrap_or("0"));
                let guardian_spare_parts_discount = parse_f64(row["GuardianSparePartsDiscount"].as_str().unwrap_or("0"));
                let guardian_technician_discount = parse_f64(row["GuardianTechnicianDiscount"].as_str().unwrap_or("0"));
                let old_id = row["_OldID"].as_i64().map(|v| v as i32);

                let res = sqlx::query(
                    "INSERT INTO prices (full_diet_rate, half_diet_rate, hotel_rate, hourly_rate_specialist, hourly_rate_technician, km_rate, year_price, guardian_blades_discount, guardian_spare_parts_discount, guardian_technician_discount, old_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
                )
                .bind(full_diet_rate)
                .bind(half_diet_rate)
                .bind(hotel_rate)
                .bind(hourly_rate_specialist)
                .bind(hourly_rate_technician)
                .bind(km_rate)
                .bind(year_price)
                .bind(guardian_blades_discount)
                .bind(guardian_spare_parts_discount)
                .bind(guardian_technician_discount)
                .bind(old_id)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "offers" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let id_guardian_offer = row["IdGuardianOffer"].as_str().unwrap_or("");
                let customer_id = row["CustomerID"].as_str().unwrap_or("");
                let account_name = row["Account name"].as_str().map(|s| s.to_string());
                let date_guardian = row["DateGuardian"].as_str().and_then(|s| parse_date(s));
                let status = row["Status"].as_str().map(|s| s.to_string());
                let responsible_person = row["ResponsiblePerson"].as_str().map(|s| s.to_string());
                let equipment_plate = row["EquipmentPlate"].as_str().map(|s| s.to_string());
                let inspection_frequency = row["InspectionFrequency"].as_str().map(|s| s.to_string());
                let language = row["Lenguaje"].as_str().map(|s| s.to_string());
                let diets = parse_f64(row["Diets"].as_str().unwrap_or("0"));
                let hotel_nights = row["HotelNights"].as_i64().map(|v| v as i32);
                let trip = parse_f64(row["Trip"].as_str().unwrap_or("0"));
                let trip_hours = parse_f64(row["TripHours"].as_str().unwrap_or("0"));
                let work_hours = parse_f64(row["WorkHours"].as_str().unwrap_or("0"));
                let total_hours = parse_f64(row["TotalHours"].as_str().unwrap_or("0"));
                let basic_kit_price = parse_f64(row["BasicKitPrice"].as_str().unwrap_or("0"));
                let basic_kit_hours = parse_f64(row["BasicKitHours"].as_str().unwrap_or("0"));
                let discount = parse_f64(row["Discount"].as_str().unwrap_or("0"));
                let hours_import = parse_f64(row["HoursImport"].as_str().unwrap_or("0"));
                let report_hours = parse_f64(row["ReportHours"].as_str().unwrap_or("0"));
                let total = parse_f64(row["Total"].as_str().unwrap_or("0"));
                let total_end = parse_f64(row["TotalEnd"].as_str().unwrap_or("0"));
                let general_comments = row["GeneralComments"].as_str().map(|s| s.to_string());
                let summary_notes = row["SummaryNotes"].as_str().map(|s| s.to_string());

                if id_guardian_offer.is_empty() || customer_id.is_empty() {
                    result.errors.push(format!("Row {}: missing required fields", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO offers (id_guardian_offer, customer_id, account_name, date_guardian, status, responsible_person, equipment_plate, inspection_frequency, language, diets, hotel_nights, trip, trip_hours, work_hours, total_hours, basic_kit_hours, basic_kit_price, discount, hours_import, report_hours, total, total_end, general_comments, summary_notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) ON CONFLICT (id_guardian_offer) DO NOTHING",
                )
                .bind(id_guardian_offer)
                .bind(customer_id)
                .bind(account_name)
                .bind(date_guardian)
                .bind(status)
                .bind(responsible_person)
                .bind(equipment_plate)
                .bind(inspection_frequency)
                .bind(language)
                .bind(diets.unwrap_or(0.0))
                .bind(hotel_nights.unwrap_or(0))
                .bind(trip.unwrap_or(0.0))
                .bind(trip_hours.unwrap_or(0.0))
                .bind(work_hours.unwrap_or(0.0))
                .bind(total_hours.unwrap_or(0.0))
                .bind(basic_kit_hours.unwrap_or(0.0))
                .bind(basic_kit_price.unwrap_or(0.0))
                .bind(discount.unwrap_or(0.0))
                .bind(hours_import.unwrap_or(0.0))
                .bind(report_hours.unwrap_or(0.0))
                .bind(total.unwrap_or(0.0))
                .bind(total_end.unwrap_or(0.0))
                .bind(general_comments)
                .bind(summary_notes)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        _ => {
            return Err((
                axum::http::StatusCode::BAD_REQUEST,
                Json(json!({ "error": format!("Unknown table: {}", payload.table) })),
            ));
        }
    }

    Ok(Json(result))
}

fn parse_f64(s: &str) -> Option<f64> {
    let cleaned: String = s.replace(',', ".").trim().to_string();
    if cleaned.is_empty() || cleaned == "0" {
        return None;
    }
    cleaned.parse().ok()
}

fn parse_date(s: &str) -> Option<chrono::NaiveDate> {
    let formats = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"];
    for format in formats {
        if let Ok(d) = chrono::NaiveDate::parse_from_str(s.trim(), format) {
            return Some(d);
        }
    }
    None
}
