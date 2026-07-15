use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

pub async fn create_pool(database_url: &str) -> PgPool {
    PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .connect(database_url)
        .await
        .unwrap_or_else(|e| {
            tracing::error!("Failed to connect to database: {}", e);
            tracing::error!("DATABASE_URL starts with: {}", &database_url[..database_url.find('@').unwrap_or(20).min(database_url.len())]);
            panic!("Database connection failed: {}", e);
        })
}
