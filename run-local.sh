#!/bin/bash
# ORION SENTINEL — Native Local Launcher (No Docker)

set -e

echo "🛰️  ORION SENTINEL — Local Launch"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check prerequisites
echo ""
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/ (v20+)"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install from https://python.org/ (v3.11+)"
    exit 1
fi

if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Install pip for Python 3"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js v20+ recommended. You have $(node -v)"
fi

echo -e "${GREEN}✅${NC} Prerequisites met"

# Install dependencies if needed
echo ""
echo "Checking dependencies..."

if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ] || [ ! -d "node_modules" ]; then
    echo "Installing Node dependencies..."
    npm run install:all
else
    echo -e "${GREEN}✅${NC} Node dependencies already installed"
fi

# Check Python NLP dependencies
if ! python3 -c "import spacy" 2>/dev/null; then
    echo "Installing Python NLP dependencies..."
    cd nlp-service
    pip3 install -r requirements.txt
    python3 -m spacy download en_core_web_sm
    cd ..
else
    echo -e "${GREEN}✅${NC} Python NLP dependencies already installed"
fi

# Ensure .env exists
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️${NC}  Created backend/.env from template. Edit it to add API keys."
fi

echo ""
echo "=================================="
echo -e "${CYAN}Starting services...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    pkill -f "node.*backend/server.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "uvicorn.*nlp-service" 2>/dev/null || true
    echo -e "${GREEN}✅${NC} All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo -e "${CYAN}[1/3]${NC} Starting Backend API on http://localhost:4000"
cd backend
NODE_ENV=development PORT=4000 CLIENT_URL=http://localhost:3000 USE_REAL_INGESTION=false npx nodemon server.js &
BACKEND_PID=$!
cd ..
sleep 3

# Start NLP Service
echo -e "${CYAN}[2/3]${NC} Starting NLP Service on http://localhost:5000"
cd nlp-service
python3 -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload &
NLP_PID=$!
cd ..
sleep 3

# Start Frontend
echo -e "${CYAN}[3/3]${NC} Starting Frontend on http://localhost:3000"
cd frontend
npx vite --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
cd ..

echo ""
echo "=================================="
echo -e "${GREEN}🚀 ORION SENTINEL is running!${NC}"
echo ""
echo "  Dashboard:    ${CYAN}http://localhost:3000${NC}"
echo "  API:          ${CYAN}http://localhost:4000${NC}"
echo "  NLP API:      ${CYAN}http://localhost:5000/docs${NC}"
echo "  Health:       ${CYAN}http://localhost:4000/health${NC}"
echo ""
echo "  Press ${YELLOW}Ctrl+C${NC} to stop all services"
echo "=================================="

# Wait for all background processes
wait $BACKEND_PID
wait $NLP_PID
wait $FRONTEND_PID
