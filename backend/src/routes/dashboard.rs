use axum::{extract::State, Json};
use serde_json::{json, Value};
use sqlx::PgPool;

pub async fn get_dashboard(State(db): State<PgPool>) -> Json<Value> {
    let total_items: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM items")
        .fetch_one(&db)
        .await
        .unwrap_or(0);

    Json(json!({
        "stats": {
            "total_items": total_items,
        },
        "recent_activity": []
    }))
}
