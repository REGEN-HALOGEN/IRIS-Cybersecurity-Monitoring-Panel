use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use tracing::error;

#[derive(Debug)]
pub enum AppError {
    InternalServerError(String),
    BadRequest(String),
    NotFound(String),
    Unauthorized(String),
    Forbidden(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message, error_code) = match self {
            AppError::InternalServerError(msg) => {
                error!("Internal Server Error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string(), "INTERNAL_ERROR")
            }
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg, "BAD_REQUEST"),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg, "NOT_FOUND"),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg, "UNAUTHORIZED"),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, msg, "FORBIDDEN"),
        };

        let body = Json(json!({
            "error": error_message,
            "code": error_code,
        }));

        (status, body).into_response()
    }
}
  
