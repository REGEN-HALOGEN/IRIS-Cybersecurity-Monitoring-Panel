# 🛡️ Cybersecurity Monitoring Panel — I.R.I.S
### Intelligent Response & Intrusion System

I.R.I.S is a modular, enterprise-style cybersecurity monitoring panel for Windows systems, featuring a sleek, minimal UI. It provides comprehensive real-time telemetry tracking, active system health evaluation, and an interactive Security Operations Center (SOC) dashboard.

---

## 🧩 High-Level Architecture
- **Backend**: Rust (`axum`), REST API handling, WebSocket/SSE endpoints for real-time pushing.
- **Database**: PostgreSQL (`sqlx`) managing device states, telemetry histories, and alert triggers.
- **Frontend**: Next.js 14 (App Router) + Tauri wrapper.
- **State Management**: `zustand` maintaining historical graph logic (bounded 100-tick ring arrays).
- **Styling**: `Tailwind CSS`, `shadcn/ui`, minimal amoled black components with seamless micro-animations.
- **AI Integration**: Explains complex resource alerts using an LLM provider (Ollama / Local or OpenAI via `reqwest`).

---

## ⚡ Current Working Features

- **Live Telemetry Engine via WebSockets**: Backend channels pipe hardware metrics immediately into the Next.js frontend state manager (`useDeviceStore`).
- **Interactive SOC Grid Layout**: Dashboard page includes split UI mapping real-time CPU spikes, Memory limits, and Device Status.
- **Historical Analysis Controls**: The main AreaChart visualizer allows dynamically selecting bounds (1m, 5m, 15m) processed instantly from the trailing memory cache.
- **Real-Time Activity Feed**: Automatic inference captures incoming telemetry boundaries and registers them immediately as visually colored severity alerts directly to the sidebar log tracker.
- **AI Assistant Analyzer**: A dynamic modal panel hooked into the REST API explains why active threats or resource storms occur (e.g. `high_cpu` detection), proposing responsive actions.
- **Tauri/Next Authentication Bridge**: JWT handles token swaps successfully stored dynamically in `localStorage` avoiding cross-Origin restriction failures common to webview cookie bounds.
- **Animated Amoled UI**: Fully dark-mode `bg-black/grey` aesthetic featuring Three.js dotted background planes and native Shadcn primitives stripped of legacy React Node wrappers.
- **Click & Run Configuration**: Local orchestration fully driven by `start.bat`.

---

## ⚙️ Technical Details
### Backend (Rust / Axum)
Handles asynchronous traffic and real-time socket connections. Applies standard auth headers and CORS middleware layer configured via `tower_http`. Implements structured `axum::Router` mapping for controllers (`/ai`, `/devices`, `/ws`, `/auth`). Data ingestion uses PostgreSQL (`sqlx`).

### Frontend (Next.js / Tauri)
Features an SPA dashboard heavily optimized for real-time re-rendering without UI thread blocking. Uses `Recharts` for fluid dataset visualization. Component structure leverages custom themes and native hooks.

---

## 🚀 Getting Started
Launch the entire I.R.I.S ecosystem instantly. Ensure Docker, Rust, and Node.js are ready.
`start.bat` orchestrates the PostgreSQL database, Rust backend, telemetry agent, and Next.js frontend.
```bash
./start.bat
```

---

> **Status:** Alpha Version 0.1
*This is the initial Alpha v0.1 release, covering core feature functionality, UI scaffolding, active database/WS bindings, and AI integration limits.*