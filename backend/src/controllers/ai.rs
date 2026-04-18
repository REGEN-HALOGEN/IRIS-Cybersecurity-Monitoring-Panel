use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router, Extension,
};
use sqlx::PgPool;
use uuid::Uuid;
use std::env;
use crate::errors::AppError;

pub fn ai_routes() -> Router {
    Router::new()
        .route("/explain/:id", get(explain_alert))
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct AIExplanation {
    explanation: Option<String>,
    risk_level: Option<String>,
    recommended_actions: Vec<String>,
    fallback: bool,
    fallback_reason: Option<String>,
}

#[axum::debug_handler]
async fn explain_alert(
    Extension(_pool): Extension<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<AIExplanation>, AppError> {
    // Mock for now, but configured to use a proper LLM API if requested
    let ollama_url = env::var("OLLAMA_URL").unwrap_or_else(|_| "http://localhost:11434".to_string());
    let prompt = format!("Explain why alert {} happened. The alert is usually related to high CPU usage.", id);

    let client = reqwest::Client::new();
    let req = client.post(format!("{}/api/generate", ollama_url))
        .json(&serde_json::json!({
            "model": "llama3", // or another small model
            "prompt": prompt,
            "stream": false
        }))
        .send().await;

    match req {
        Ok(resp) if resp.status().is_success() => {
            if let Ok(data) = resp.json::<serde_json::Value>().await {
                if let Some(text) = data["response"].as_str() {
                    return Ok(Json(AIExplanation {
                        explanation: Some(text.to_string()),
                        risk_level: Some("high".to_string()),
                        recommended_actions: vec![
                            "Review task manager".to_string(),
                            "Check for rogue processes".to_string()
                        ],
                        fallback: false,
                        fallback_reason: None,
                    }));
                }
            }
        }
        _ => {}
    }

    Ok(Json(AIExplanation {
        explanation: Some(format!("Analysis for alert {} indicates high resource usage anomaly.", id)),
        risk_level: Some("high".to_string()),
        recommended_actions: vec![
            "Identify the process consuming resources".to_string(),
            "Consider isolating the device if behavior is unexpected".to_string(),
        ],
        fallback: true,
        fallback_reason: Some("AI service is currently unavailable. Using rule-based fallback.".to_string()),
    }))
}
