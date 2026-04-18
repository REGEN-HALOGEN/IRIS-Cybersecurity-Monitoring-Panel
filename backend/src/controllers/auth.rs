use axum::{
    http::StatusCode,
    routing::post,
    Json, Router, Extension,
};
use sqlx::PgPool;

use crate::{
    errors::AppError,
    models::user::{AuthResponse, LoginDto, RegisterDto},
    services::auth,
};

pub fn auth_routes() -> Router {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
}

#[axum::debug_handler]
async fn register(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<RegisterDto>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = auth::register(&pool, payload).await?;
    
    // Auto-login after register
    let token = auth::generate_jwt(&user)?;

    Ok(Json(AuthResponse {
        token,
        user: user.into(),
    }))
}

#[axum::debug_handler]
async fn login(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<LoginDto>,
) -> Result<Json<AuthResponse>, AppError> {
    let (user, token) = auth::login(&pool, payload).await?;

    Ok(Json(AuthResponse {
        token,
        user: user.into(),
    }))
}