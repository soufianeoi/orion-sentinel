@echo off
REM ORION SENTINEL — Windows Local Launcher (No Docker)

echo 🛰️  ORION SENTINEL — Local Launch
echo ==================================

REM Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Install from https://nodejs.org/
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Install from https://python.org/
    exit /b 1
)

REM Install dependencies if needed
if not exist "backend\node_modules" (
    echo Installing dependencies...
    call npm run install:all
)

REM Ensure .env exists
if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo ⚠️  Created backend/.env. Edit it to add API keys.
)

echo.
echo Starting services...
echo.

REM Start Backend
echo [1/3] Starting Backend API on http://localhost:4000
start "ORION Backend" cmd /k "cd backend && set NODE_ENV=development&& set PORT=4000&& set CLIENT_URL=http://localhost:3000&& set USE_REAL_INGESTION=false&& npx nodemon server.js"
timeout /t 3 /nobreak >nul

REM Start NLP
echo [2/3] Starting NLP Service on http://localhost:5000
start "ORION NLP" cmd /k "cd nlp-service && python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [3/3] Starting Frontend on http://localhost:3000
start "ORION Frontend" cmd /k "cd frontend && npx vite --host 0.0.0.0 --port 3000"

echo.
echo ==================================
echo 🚀 ORION SENTINEL is running!
echo.
echo   Dashboard:    http://localhost:3000
echo   API:          http://localhost:4000
echo   NLP API:      http://localhost:5000/docs
echo   Health:       http://localhost:4000/health
echo.
echo   Close the terminal windows to stop
echo ==================================
