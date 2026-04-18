@echo off
title I.R.I.S Application Launcher
echo ===================================================
echo       I.R.I.S - Intelligent Response System
echo ===================================================

echo [1/4] Starting PostgreSQL Database (Docker)...
docker compose up -d
timeout /t 3 /nobreak >nul

echo [2/4] Starting Backend (Rust Axum API)...
start "IRIS Backend" cmd /k "cd backend && cargo run"

echo Waiting for backend to initialize before starting dependents...
timeout /t 5 /nobreak >nul

echo [3/4] Starting Windows Agent (Rust)...
start "IRIS Agent" cmd /k "cd agent && cargo run --bin agent"

echo [4/4] Starting Frontend (Tauri Desktop App)...
start "IRIS Frontend" cmd /k "cd frontend && pnpm tauri dev"

echo ===================================================
echo All services have been launched in separate windows!
echo You can close this launcher window safely.
echo ===================================================
pause
exit
