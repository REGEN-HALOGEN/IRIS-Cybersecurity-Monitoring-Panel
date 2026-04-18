pub mod config;
pub mod controllers;
pub mod db;
pub mod errors;
pub mod middleware;
pub mod models;
pub mod routes;
pub mod services;
pub mod utils;
pub mod ws;

use std::net::SocketAddr;
use tracing::info;
use tracing_subscriber::EnvFilter;
use axum::serve;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("backend=debug")
        .init();

    info!("Starting I.R.I.S Backend on port 8080...");

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()?;
    
    let db_pool = db::init_pool().await?;

    let app = routes::create_router(db_pool);

    let listener = tokio::net::TcpListener::bind(SocketAddr::from(([0, 0, 0, 0], port))).await?;
    info!("Listening on {}", port);
    
    serve(listener, app).await?;

    Ok(())
}
