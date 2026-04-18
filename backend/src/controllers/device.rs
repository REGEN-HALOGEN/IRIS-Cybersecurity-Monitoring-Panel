use axum::{
    extract::{Path, State},
    routing::{get, post, delete},
    Json, Router, Extension,
};
use sqlx::PgPool;
use uuid::Uuid;
use std::sync::Arc;
use serde_json::Value;

use crate::{
    errors::AppError,
    models::device::{Device, DeviceRegistrationResponse, RegisterDeviceDto},
    services::device,
    ws::{WsState, WsEvent},
};

pub fn device_routes() -> Router {
    Router::new()
        .route("/register", post(register_device))
        .route("/data", post(receive_telemetry).route_layer(axum::middleware::from_fn(crate::middleware::agent_auth::agent_auth_middleware)))
        .route("/", get(list_devices))
        .route("/:id", get(get_device).delete(delete_device))
}

#[axum::debug_handler]
async fn register_device(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<RegisterDeviceDto>,
) -> Result<Json<DeviceRegistrationResponse>, AppError> {
    let (device, token) = device::register(&pool, payload).await?;

    Ok(Json(DeviceRegistrationResponse { device, token }))
}

#[axum::debug_handler]
async fn list_devices(
    Extension(pool): Extension<PgPool>,
) -> Result<Json<Vec<Device>>, AppError> {
    let devices = sqlx::query_as!(
        Device,
        r#"
        SELECT id, name, token_hash, status, last_seen, created_at
        FROM devices
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|_| AppError::InternalServerError("Failed to query devices".into()))?;

    Ok(Json(devices))
}

#[axum::debug_handler]
async fn get_device(
    Extension(pool): Extension<PgPool>,
    Path(device_id): Path<Uuid>,
) -> Result<Json<Device>, AppError> {
    let device = sqlx::query_as!(
        Device,
        r#"
        SELECT id, name, token_hash, status, last_seen, created_at
        FROM devices
        WHERE id = $1
        "#,
        device_id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|_| AppError::InternalServerError("Database error".into()))?
    .ok_or_else(|| AppError::NotFound("Device not found".into()))?;

    Ok(Json(device))
}

#[axum::debug_handler]
async fn delete_device(
    Extension(pool): Extension<PgPool>,
    Path(device_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    sqlx::query!("DELETE FROM devices WHERE id = $1", device_id)
        .execute(&pool)
        .await
        .map_err(|_| AppError::InternalServerError("Failed to delete device".into()))?;

    Ok(Json(serde_json::json!({ "success": true })))
}

#[axum::debug_handler]
async fn receive_telemetry(
    Extension(pool): Extension<PgPool>,
    Extension(device): Extension<Device>,
    Extension(ws): Extension<Arc<WsState>>,
    Json(payload): Json<Value>,
) -> Result<Json<Value>, AppError> {
    
    // Store telemetry
    sqlx::query!(
        "INSERT INTO telemetry (device_id, payload) VALUES ($1, $2)",
        device.id,
        payload
    )
    .execute(&pool)
    .await
    .map_err(|_| AppError::InternalServerError("Failed to store telemetry".into()))?;

    // Update device last_seen and status
    sqlx::query!(
        "UPDATE devices SET last_seen = NOW(), status = 'online' WHERE id = $1",
        device.id
    )
    .execute(&pool)
    .await
    .map_err(|_| AppError::InternalServerError("Failed to update device status".into()))?;

    // In a real scenario, evaluate rules and trigger alerts here
    // Broadcast telemetry update to frontend
    let mut evt_payload = payload.clone();
    evt_payload["device_id"] = serde_json::json!(device.id);
    let _ = ws.tx.send(WsEvent::TelemetryUpdate(evt_payload));

    Ok(Json(serde_json::json!({ "success": true })))
}
