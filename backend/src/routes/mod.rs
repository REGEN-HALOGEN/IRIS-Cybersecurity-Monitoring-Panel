use axum::routing::get;
use axum::{Router, Extension};
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};

use crate::controllers;
use crate::ws::{WsState, WsEvent};

pub fn create_router(pool: PgPool) -> Router {
    let (tx, _) = broadcast::channel(100);
    let ws_state = Arc::new(WsState { tx });

    let cors = CorsLayer::new()
        // allow `GET` and `POST` when accessing the resource
        .allow_methods(Any)
        // allow requests from any origin
        .allow_origin(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .nest("/auth", controllers::auth::auth_routes())
        .nest("/devices", controllers::device::device_routes())
        .nest("/ai", controllers::ai::ai_routes())
        .nest("/ws", crate::ws::ws_routes(ws_state.clone()));

    Router::new()
        .route("/health", get(|| async { "OK" }))
        .nest("/api/v1", api_routes)
        // Add more routes here later (e.g., alerts, devices)
        .layer(cors)
        .layer(Extension(pool))
        .layer(Extension(ws_state))
}
