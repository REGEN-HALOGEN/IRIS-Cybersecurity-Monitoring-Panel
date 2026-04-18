use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::device::{Device, RegisterDeviceDto},
};

pub async fn register(pool: &PgPool, dto: RegisterDeviceDto) -> Result<(Device, String), AppError> {
    let raw_token = Uuid::new_v4().to_string();

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    let token_hash = argon2
        .hash_password(raw_token.as_bytes(), &salt)
        .map_err(|_| AppError::InternalServerError("Failed to hash device token".into()))?
        .to_string();

    let device_id = Uuid::new_v4();
    let auth_token = format!("{}:{}", device_id, raw_token); // agent sends "device_id:raw_token"

    let device = sqlx::query_as!(
        Device,
        r#"
        INSERT INTO devices (id, name, token_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, token_hash, status, last_seen, created_at
        "#,
        device_id,
        dto.name,
        token_hash
    )
    .fetch_one(pool)
    .await
    .map_err(|_| AppError::InternalServerError("Failed to register device".into()))?;

    Ok((device, auth_token))
}

pub async fn verify_agent_token(pool: &PgPool, auth_token: &str) -> Result<Device, AppError> {
    let parts: Vec<&str> = auth_token.split(':').collect();
    if parts.len() != 2 {
        return Err(AppError::Unauthorized("Invalid device token format".into()));
    }

    let device_id = Uuid::parse_str(parts[0])
        .map_err(|_| AppError::Unauthorized("Invalid device ID format".into()))?;
    let raw_token = parts[1];

    let device = sqlx::query_as!(
        Device,
        r#"
        SELECT id, name, token_hash, status, last_seen, created_at
        FROM devices
        WHERE id = $1
        "#,
        device_id
    )
    .fetch_optional(pool)
    .await
    .map_err(|_| AppError::InternalServerError("Database error".into()))?
    .ok_or_else(|| AppError::Unauthorized("Device not found".into()))?;

    let parsed_hash = PasswordHash::new(&device.token_hash)
        .map_err(|_| AppError::InternalServerError("Invalid token format in db".into()))?;
    
    Argon2::default()
        .verify_password(raw_token.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid device token".into()))?;

    Ok(device)
}
