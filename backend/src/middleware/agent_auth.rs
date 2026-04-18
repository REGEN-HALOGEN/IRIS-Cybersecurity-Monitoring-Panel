use axum::{
    extract::{Request, Extension},
    http::{header, HeaderValue},
    middleware::Next,
    response::Response,
};
use sqlx::PgPool;

use crate::{errors::AppError, models::device::Device, services::device::verify_agent_token};

pub async fn agent_auth_middleware(
    Extension(pool): Extension<PgPool>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|val| val.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing device token".into()))?;

    let token_raw = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization header format".into()))?;

    let device = verify_agent_token(&pool, token_raw).await?;
    
    // Store authenticated device in request extensions
    req.extensions_mut().insert(device);

    Ok(next.run(req).await)
}