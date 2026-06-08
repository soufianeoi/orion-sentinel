# 🖥️ Local Development Guide (No Docker)

Run ORION SENTINEL natively on your machine without any containers.

## Prerequisites

| Tool | Version | Install Link |
|------|---------|-------------|
| **Node.js** | 20+ | https://nodejs.org/ |
| **Python** | 3.11+ | https://python.org/ |
| **pip** | 23+ | Comes with Python |
| **Git** | Any | https://git-scm.com/ |

**Optional (for production mode):**
| Tool | Purpose | Install |
|------|---------|---------|
| **PostgreSQL** | Data persistence | https://postgresql.org/ |
| **Redis** | Caching & queues | https://redis.io/ |
| **PostGIS** | Geospatial extension | `CREATE EXTENSION postgis;` |

> **Note:** PostgreSQL and Redis are **optional**. The platform runs perfectly in **mock mode** without them. Install them only when you're ready to persist real ingested data.

---

## 🚀 One-Command Launch

### macOS / Linux
```bash
./run-local.sh
```

### Windows
```cmd
run-local.bat
```

This starts all three services:
- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:4000
- **NLP Service** → http://localhost:5000

Press `Ctrl+C` to stop everything.

---

## 🛠️ Manual Setup (Step by Step)

If the script doesn't work, run each service manually:

### 1. Install Dependencies

```bash
# Root orchestrator
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# NLP Service
cd nlp-service
pip3 install -r requirements.txt
python3 -m spacy download en_core_web_sm
cd ..
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — all keys are optional for demo mode
```

### 3. Start Services (in separate terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Or: node server.js
```

**Terminal 2 — NLP:**
```bash
cd nlp-service
python3 -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
# Or: npx vite --host 0.0.0.0 --port 3000
```

---

## 📊 What Runs Without Docker

| Service | Runs Natively? | Needs Docker? | Notes |
|---------|---------------|---------------|-------|
| React Dashboard | ✅ Yes | No | Vite dev server |
| Express API | ✅ Yes | No | Node.js directly |
| WebSocket | ✅ Yes | No | Built into Express |
| NLP (Python) | ✅ Yes | No | Uvicorn dev server |
| Mock Data | ✅ Yes | No | In-memory store |
| PostgreSQL | ⚠️ Optional | Optional | Only for persistence |
| Redis | ⚠️ Optional | Optional | Only for queues |
| Nginx | ⚠️ Optional | Optional | Only for production SSL |

---

## 🔌 Enabling Real Data (No Docker)

### Step 1: Get Free API Keys

| Source | Cost | Get Key At |
|--------|------|-----------|
| **NewsAPI** | Free (100/day) | https://newsapi.org/register |
| **Reddit** | Free | https://www.reddit.com/prefs/apps |
| **AlienVault OTX** | Free | https://otx.alienvault.com/ |

### Step 2: Edit `.env`

```bash
# backend/.env
USE_REAL_INGESTION=true
NEWSAPI_KEY=your_key_here
REDDIT_CLIENT_ID=your_id
REDDIT_SECRET=your_secret
ALIENVAULT_OTX_KEY=your_key
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

The orchestrator will now pull real data from configured sources.

---

## 🗄️ Adding PostgreSQL (Optional)

When you're ready to persist data:

### 1. Install PostgreSQL + PostGIS

**macOS:**
```bash
brew install postgresql
brew install postgis
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis
sudo systemctl start postgresql
```

**Windows:**
Download installer from https://postgresql.org/download/

### 2. Create Database

```bash
sudo -u postgres psql
CREATE DATABASE osint_platform;
CREATE USER osint WITH PASSWORD 'osint_secure_2026';
GRANT ALL PRIVILEGES ON DATABASE osint_platform TO osint;
\c osint_platform
CREATE EXTENSION postgis;
\q
```

### 3. Run Schema

```bash
psql -U osint -d osint_platform -f backend/sql/init.sql
```

### 4. Update `.env`

```bash
DATABASE_URL=postgresql://osint:osint_secure_2026@localhost:5432/osint_platform
```

### 5. Restart Backend

---

## 🔄 Adding Redis (Optional)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

**Update `.env`:**
```bash
REDIS_URL=redis://localhost:6379
```

---

## 🧪 Verify Everything Works

```bash
# Check all services are running
curl http://localhost:4000/health
curl http://localhost:5000/health
curl http://localhost:3000  # (Vite dev server)

# Check API endpoints
curl http://localhost:4000/api/events
curl http://localhost:4000/api/metrics
curl http://localhost:4000/api/timeline

# Test NLP
curl -X POST http://localhost:5000/classify   -H "Content-Type: application/json"   -d '{"text": "Naval exercise detected in disputed waters", "candidate_labels": ["conflict", "economic", "diplomatic"]}'
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Node Modules Missing
```bash
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

### Python Import Errors
```bash
cd nlp-service
pip3 install --upgrade -r requirements.txt
python3 -m spacy download en_core_web_sm
```

### CORS Errors in Browser
Make sure `CLIENT_URL=http://localhost:3000` is set in `backend/.env`.

---

## 📝 Development Workflow

```bash
# Terminal 1: Backend (auto-reload on file changes)
cd backend && npm run dev

# Terminal 2: NLP (auto-reload on file changes)
cd nlp-service && uvicorn main:app --reload

# Terminal 3: Frontend (auto-reload on file changes)
cd frontend && npm run dev

# Browser: http://localhost:3000
```

Any code change triggers automatic reload in that service. No Docker rebuild needed.

---

## 🎯 Quick Commands

```bash
# Start everything (one command)
./run-local.sh

# Or use npm scripts
npm run dev          # All services
npm run backend      # Backend only
npm run frontend     # Frontend only
npm run nlp          # NLP only

# Install everything
npm run install:all
```
