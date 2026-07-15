mod db;
mod models;
mod routes;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        )
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in environment or .env file");

    let db_pool = db::create_pool(&database_url).await;

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", axum::routing::get(routes::health::health_check))
        .route(
            "/api/dashboard",
            axum::routing::get(routes::dashboard::get_dashboard),
        )
        .route(
            "/api/items",
            axum::routing::get(routes::items::list_items)
                .post(routes::items::create_item),
        )
        .route(
            "/api/items/{id}",
            axum::routing::get(routes::items::get_item)
                .put(routes::items::update_item)
                .delete(routes::items::delete_item),
        )
        .route(
            "/api/installed-base",
            axum::routing::get(routes::installed_base::list_installed_base),
        )
        .route(
            "/api/installed-base/search",
            axum::routing::get(routes::installed_base::search_installed_base),
        )
        .route(
            "/api/installed-base/stats",
            axum::routing::get(routes::installed_base::get_installed_base_stats),
        )
        .layer(cors)
        .with_state(db_pool);

    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tracing::info!("Server started on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
