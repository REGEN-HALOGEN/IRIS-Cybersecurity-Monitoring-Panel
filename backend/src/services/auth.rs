use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::env;
use uuid::Uuid;

use crate::{
    errors::AppError,
    models::user::{LoginDto, RegisterDto, Role, User},
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub role: Role,
    pub exp: usize,
}

pub fn generate_jwt(user: &User) -> Result<String, AppError> {
    let secret = env::var("SECRET_KEY").expect("SECRET_KEY must be set");
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(8))
        .expect("Valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user.id,
        role: user.role.clone(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| AppError::InternalServerError("Failed to generate token".into()))
}

pub async fn register(pool: &PgPool, dto: RegisterDto) -> Result<User, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    let password_hash = argon2
        .hash_password(dto.password.as_bytes(), &salt)
        .map_err(|_| AppError::InternalServerError("Failed to hash password".into()))?
        .to_string();

    let role = dto.role.unwrap_or(Role::Viewer);

    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, password_hash, role as "role: Role", created_at
        "#,
        dto.email,
        password_hash,
        role as Role,
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        // Handle duplicate email unique constraint error
        if let sqlx::Error::Database(db_err) = &e {
            if db_err.message().contains("unique constraint") {
                return AppError::BadRequest("Email already in use".into());
            }
        }
        AppError::InternalServerError("Failed to create user".into())
    })?;

    Ok(user)
}

pub async fn login(pool: &PgPool, dto: LoginDto) -> Result<(User, String), AppError> {
    let user = sqlx::query_as!(
        User,
        r#"
        SELECT id, email, password_hash, role as "role: Role", created_at
        FROM users
        WHERE email = $1
        "#,
        dto.email
    )
    .fetch_optional(pool)
    .await
    .map_err(|_| AppError::InternalServerError("Database error".into()))?
    .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| AppError::InternalServerError("Invalid password format in db".into()))?;
    
    Argon2::default()
        .verify_password(dto.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid email or password".into()))?;

    let token = generate_jwt(&user)?;

    Ok((user, token))
}
