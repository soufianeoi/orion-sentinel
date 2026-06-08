#!/bin/bash
# ORION SENTINEL Setup Script

set -e

echo "🛰️  ORION SENTINEL - Setup"
echo "================================"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. You'll need it for local development (not required for Docker)."
fi

echo "✅ Prerequisites met"

# Setup environment
echo ""
echo "Setting up environment..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
    echo "⚠️  Please edit backend/.env and add your API keys"
else
    echo "✅ backend/.env already exists"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."

cd backend
npm install
cd ..

cd frontend
npm install
cd ..

echo "✅ Dependencies installed"

# Build NLP service
echo ""
echo "Building NLP service..."
cd nlp-service
docker build -t orion-nlp:latest .
cd ..

echo "✅ NLP service built"

# Start infrastructure
echo ""
echo "Starting infrastructure services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Set USE_REAL_INGESTION=true when ready"
echo "3. Run: docker-compose up -d"
echo "4. Open: http://localhost:3000"
echo ""
echo "For local development:"
echo "- Frontend: cd frontend && npm run dev"
echo "- Backend: cd backend && npm run dev"
echo "- NLP: cd nlp-service && python main.py"
echo ""
