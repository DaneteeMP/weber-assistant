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
        "guardian_summary" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let id_guardian_offer = row["IdGuardianOffer"].as_str().unwrap_or("");
                let customer_id = row["CustomerID"].as_str().unwrap_or("");
                let account_name = row["Account name"].as_str().map(|s| s.to_string());
                let equipment = row["Equipment"].as_str().map(|s| s.to_string());
                let date_guardian = row["DateGuardian"].as_str().and_then(|s| parse_date(s));
                let inspection_frequency = row["InspectionFrequency"].as_str().map(|s| s.to_string());
                let basic_kit = row["BasicKit"].as_str().map(|s| s.to_uppercase() == "TRUE");
                let total = parse_f64(row["Total"].as_str().unwrap_or("0"));
                let discount = parse_f64(row["Discount"].as_str().unwrap_or("0"));
                let total_end = parse_f64(row["TotalEnd"].as_str().unwrap_or("0"));
                let basic_kit_price = parse_f64(row["BasicKitPrice"].as_str().unwrap_or("0"));
                let acceptance_date = row["AcceptanceDate"].as_str().and_then(|s| parse_date(s));
                let audit_amount = parse_f64(row["AuditAmount"].as_str().unwrap_or("0"));
                let audit_comments = row["AuditComments"].as_str().map(|s| s.to_string());
                let audit_date = row["AuditDate"].as_str().and_then(|s| parse_date(s));
                let audit_number_invoice = row["AuditNumberInvoice"].as_str().map(|s| s.to_string());
                let audit_report = row["AuditReport"].as_str().map(|s| s.to_string());
                let maintenance_checklist_number = row["MaintenanceChecklistNumber"].as_str().map(|s| s.to_string());
                let maintenance_comments = row["MaintenanceComments"].as_str().map(|s| s.to_string());
                let maintenance_date = row["MaintenanceDate"].as_str().and_then(|s| parse_date(s));
                let maintenance_sat_amount = parse_f64(row["MaintenanceSATAmount"].as_str().unwrap_or("0"));
                let maintenance_service_invoice = row["MaintenanceServiceInvoice"].as_str().map(|s| s.to_string());
                let maintenance_spare_parts_offer = row["MaintenanceSparePartsOffer"].as_str().map(|s| s.to_string());
                let maintenance_status = row["MaintenanceStatus"].as_str().map(|s| s.to_string());
                let maintenance_sat_date = row["MaitenanceSATDate"].as_str().and_then(|s| parse_date(s));
                let spare_parts_date = row["SparePartsDate"].as_str().and_then(|s| parse_date(s));
                let spare_parts_material_amount = parse_f64(row["SparePartsMaterialAmount"].as_str().unwrap_or("0"));
                let spare_parts_material_invoice = row["SparePartsMaterialInvoice"].as_str().map(|s| s.to_string());
                let summary_notes = row["SummaryNotes"].as_str().map(|s| s.to_string());
                let summary_other1 = parse_f64(row["SummaryOther1"].as_str().unwrap_or("0"));
                let summary_other2 = parse_f64(row["SummaryOther2"].as_str().unwrap_or("0"));
                let summary_total_euros = parse_f64(row["SummaryTotalEuros"].as_str().unwrap_or("0"));
                let status = row["Status"].as_str().map(|s| s.to_string());
                let bill_date = row["BillDate"].as_str().and_then(|s| parse_date(s));

                if id_guardian_offer.is_empty() || customer_id.is_empty() {
                    result.errors.push(format!("Row {}: missing required fields", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO guardian_summary (id_guardian_offer, date_guardian, customer_id, account_name, equipment, inspection_frequency, basic_kit, total, discount, total_end, basic_kit_price, acceptance_date, audit_amount, audit_comments, audit_date, audit_number_invoice, audit_report, maintenance_checklist_number, maintenance_comments, maintenance_date, maintenance_sat_amount, maintenance_service_invoice, maintenance_spare_parts_offer, maintenance_status, maintenance_sat_date, spare_parts_date, spare_parts_material_amount, spare_parts_material_invoice, summary_notes, summary_other1, summary_other2, summary_total_euros, status, bill_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)",
                )
                .bind(id_guardian_offer)
                .bind(date_guardian)
                .bind(customer_id)
                .bind(account_name)
                .bind(equipment)
                .bind(inspection_frequency)
                .bind(basic_kit)
                .bind(total)
                .bind(discount)
                .bind(total_end)
                .bind(basic_kit_price)
                .bind(acceptance_date)
                .bind(audit_amount)
                .bind(audit_comments)
                .bind(audit_date)
                .bind(audit_number_invoice)
                .bind(audit_report)
                .bind(maintenance_checklist_number)
                .bind(maintenance_comments)
                .bind(maintenance_date)
                .bind(maintenance_sat_amount)
                .bind(maintenance_service_invoice)
                .bind(maintenance_spare_parts_offer)
                .bind(maintenance_status)
                .bind(maintenance_sat_date)
                .bind(spare_parts_date)
                .bind(spare_parts_material_amount)
                .bind(spare_parts_material_invoice)
                .bind(summary_notes)
                .bind(summary_other1)
                .bind(summary_other2)
                .bind(summary_total_euros)
                .bind(status)
                .bind(bill_date)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "distances" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let km = parse_f64(row["Km"].as_str().unwrap_or("0"));
                let province = row["Province"].as_str().unwrap_or("");
                let trip_hours = parse_f64(row["TripHours"].as_str().unwrap_or("0"));
                let old_id = row["_OldID"].as_i64().map(|v| v as i32);

                if province.is_empty() {
                    result.errors.push(format!("Row {}: missing Province", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO distances (km, province, trip_hours, old_id) VALUES ($1, $2, $3, $4)",
                )
                .bind(km)
                .bind(province)
                .bind(trip_hours)
                .bind(old_id)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "equipment" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let customer_id = row["CustomerID"].as_str().unwrap_or("");
                let configuration = row["Configuration"].as_str().map(|s| s.to_string());
                let description = row["Description"].as_str().map(|s| s.to_string());
                let material = row["Material"].as_str().map(|s| s.to_string());
                let model = row["Model"].as_str().map(|s| s.to_string());
                let serial = row["Serial"].as_str().map(|s| s.to_string());
                let year = row["Year"].as_i64().map(|v| v as i32);
                let old_id = row["_OldID"].as_i64().map(|v| v as i32);

                if customer_id.is_empty() {
                    result.errors.push(format!("Row {}: missing CustomerID", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO equipment (customer_id, configuration, description, material, model, serial, year, old_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                )
                .bind(customer_id)
                .bind(configuration)
                .bind(description)
                .bind(material)
                .bind(model)
                .bind(serial)
                .bind(year)
                .bind(old_id)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "customers" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let customer_id = row["CustomerID"].as_str().unwrap_or("");
                let account_name = row["Account name"].as_str().unwrap_or("");
                let account_address = row["Account address"].as_str().map(|s| s.to_string());
                let account_city = row["Account city"].as_str().map(|s| s.to_string());
                let account_province = row["Account province"].as_str().map(|s| s.to_string());
                let account_country = row["Account Country"].as_str().map(|s| s.to_string());
                let zip_code = row["ZIPCode"].as_str().map(|s| s.to_string());
                let plant = row["Plant"].as_str().map(|s| s.to_string());
                let sales_man = row["SalesMan"].as_str().map(|s| s.to_string());
                let sector = row["Sector"].as_str().map(|s| s.to_string());
                let r#type = row["Type"].as_str().map(|s| s.to_string());
                let subsidiary = row["Subsidiary"].as_str().map(|s| s.to_string());
                let old_id = row["_OldID"].as_i64().map(|v| v as i32);

                if customer_id.is_empty() || account_name.is_empty() {
                    result.errors.push(format!("Row {}: missing required fields", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO customers (customer_id, account_name, account_address, account_city, account_province, account_country, zip_code, plant, sales_man, sector, type, subsidiary, old_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (customer_id) DO UPDATE SET account_name = EXCLUDED.account_name, account_address = EXCLUDED.account_address, account_city = EXCLUDED.account_city, account_province = EXCLUDED.account_province, account_country = EXCLUDED.account_country, zip_code = EXCLUDED.zip_code, plant = EXCLUDED.plant, sales_man = EXCLUDED.sales_man, sector = EXCLUDED.sector, type = EXCLUDED.type, subsidiary = EXCLUDED.subsidiary",
                )
                .bind(customer_id)
                .bind(account_name)
                .bind(account_address)
                .bind(account_city)
                .bind(account_province)
                .bind(account_country)
                .bind(zip_code)
                .bind(plant)
                .bind(sales_man)
                .bind(sector)
                .bind(r#type)
                .bind(subsidiary)
                .bind(old_id)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "basic_kit" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let model = row["Model"].as_str().unwrap_or("");
                let spare_parts = parse_f64(row["SpareParts"].as_str().unwrap_or("0"));
                let workload_basic_kit = parse_f64(row["WorkloadBasicKit"].as_str().unwrap_or("0"));

                if model.is_empty() {
                    result.errors.push(format!("Row {}: missing Model", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO basic_kit (model, spare_parts, workload_basic_kit) VALUES ($1, $2, $3)",
                )
                .bind(model)
                .bind(spare_parts)
                .bind(workload_basic_kit)
                .execute(&db)
                .await;

                match res {
                    Ok(_) => result.inserted += 1,
                    Err(e) => result.errors.push(format!("Row {}: {}", i + 1, e)),
                }
            }
        }
        "workload" => {
            for (i, row) in payload.rows.iter().enumerate() {
                let component_description = row["Component Description"].as_str().unwrap_or("");
                let workload = parse_f64(row["Workload"].as_str().unwrap_or("0"));

                if component_description.is_empty() {
                    result.errors.push(format!("Row {}: missing Component Description", i + 1));
                    continue;
                }

                let res = sqlx::query(
                    "INSERT INTO workload (component_description, workload) VALUES ($1, $2)",
                )
                .bind(component_description)
                .bind(workload)
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

#[derive(Debug, Serialize)]
pub struct ResetResult {
    pub tables_reset: Vec<String>,
}

pub async fn reset_data(
    State(db): State<PgPool>,
) -> Result<Json<ResetResult>, (axum::http::StatusCode, Json<Value>)> {
    let tables = [
        "offer_items",
        "offers",
        "guardian_summary",
        "clients_equipment",
        "equipment",
        "customers",
        "modules",
        "prices",
        "distances",
        "basic_kit",
        "workload",
        "installed_base",
        "items",
    ];

    let mut reset = vec![];
    for table in &tables {
        let _ = sqlx::query(&format!("TRUNCATE {} RESTART IDENTITY CASCADE", table))
            .execute(&db)
            .await;
        reset.push(table.to_string());
    }

    Ok(Json(ResetResult { tables_reset: reset }))
}
