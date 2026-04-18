use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Extension, State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct WsState {
    pub tx: broadcast::Sender<WsEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WsEvent {
    TelemetryUpdate(serde_json::Value),
    AlertCreated(serde_json::Value),
    AlertUpdated(serde_json::Value),
    DeviceStatusChanged {
        device_id: String,
        status: String,
    },
}

pub fn ws_routes(state: Arc<WsState>) -> Router {
    Router::new()
        .route("/", get(ws_handler))
        .with_state(state)
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<WsState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<WsState>) {
    let (mut sender, mut _receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            if let Ok(msg) = serde_json::to_string(&event) {
                if sender.send(Message::Text(msg.into())).await.is_err() {
                    break;
                }
            }
        }
    });
}  
