<div align="center">
  <img src="https://img.shields.io/badge/status-active-00c8ff.svg?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-00c8ff.svg?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/node-20.x-339933?style=for-the-badge&logo=node.js" alt="Node">
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/python-3.11-3776AB?style=for-the-badge&logo=python" alt="Python">
  <br>
  <img src="https://img.shields.io/badge/dashboard-live-00c8ff?style=flat-square" alt="Dashboard">
  <img src="https://img.shields.io/badge/data%20sources-7%20integrated-00c8ff?style=flat-square" alt="Data Sources">
  <img src="https://img.shields.io/badge/ingestion-real--time-00c8ff?style=flat-square" alt="Real-time">
</div>

<br>

<div align="center">
  <h1>🛰️ ORION SENTINEL</h1>
  <h3>Production-Grade Open-Source Intelligence Platform</h3>
  <p><em>Real-time threat monitoring · Geopolitical analysis · Cyber threat intelligence</em></p>
</div>

---

## Overview

Orion Sentinel is a full-stack OSINT platform that ingests, enriches, and visualizes global events from 7+ intelligence sources in real time. It combines a React dashboard (Leaflet maps, timeline correlation, curated feed) with a Node.js ingestion engine and optional Python NLP pipeline.

**Live data sources currently operational:** NewsAPI, AlienVault OTX, CISA, AISHub MarineTraffic.

---

## Quick Start

### Prerequisites

- **Node.js** 20.x (LTS)
- **npm** 10+
- *Optional:* Python 3.11 for NLP service

### Windows

```powershell
git clone https://github.com/soufianeoi/orion-sentinel.git
cd orion-sentinel

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start both services
start cmd /k "cd backend && node server.js"
start cmd /k "cd frontend && npx vite --host 0.0.0.0 --port 3000"

# Open http://localhost:3000
```

### macOS / Linux

```bash
git clone https://github.com/soufianeoi/orion-sentinel.git
cd orion-sentinel
./run-local.sh
# Open http://localhost:3000
```

### Docker (Production)

```bash
./setup.sh
docker-compose up -d
```

> **No PostgreSQL or Redis required** — the platform runs in mock/memory mode with zero external dependencies. Persistent storage is optional.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│       React 18 · Leaflet · Tailwind · WebSocket             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Vite Dev Proxy / Nginx                         │
│         /api → localhost:4000  ·  /socket.io → WS           │
└─────────┬───────────────────────────────┬───────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│   Backend (Node)    │   │   NLP Service (Python)      │
│   Express · 4000    │   │   FastAPI · 5000            │
│   Socket.io         │   │   spaCy · Transformers      │
│   Ingestion Engine  │   │   BERT · NLI · Sentiment    │
│   Geocoding         │   │   Entity Extraction         │
│   WebSocket Broker  │   │                             │
└─────────┬───────────┘   └─────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Sources                               │
│                                                              │
│  NewsAPI  ·  AlienVault OTX  ·  CISA  ·  AISHub             │
│  GDELT    ·  ACLED          ·  Sentinel-2 ·  MISP           │
│  Twitter/X · Reddit         ·  Abuse.ch   ·  Reuters        │
│  Planet Labs · AP News      ·  AFP                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Dashboard

### Global Event Monitor
Interactive world map powered by **Leaflet** with real-time event markers. Each marker is color-coded by event type (conflict, economic, diplomatic, cyber, environmental) and pulses to indicate freshness. Supports dark and satellite tile layers.

### Curated Intelligence Feed
Sidebar feed displaying all ingested events with filtering by type, source, region, and confidence score. Expandable cards provide full details including NLP-extracted entities, sentiment, and source reliability.

### Temporal Analysis
Timeline scrubber showing signal-to-intelligence correlation chains. Tracks how raw signals evolve through cross-source verification into actionable intelligence.

### Source Reliability Metrics
Live metrics dashboard tracking precision, reactivity, reliability, and system accessibility. Updates every 30 seconds with per-source health monitoring.

---

## Data Sources

| Source | Type | Tier | Key Required | Status |
|--------|------|------|-------------|--------|
| **NewsAPI** | Global News | Free / Paid | Yes | ✅ Operational |
| **AlienVault OTX** | Cyber Threat Intel | Free | Yes | ✅ Operational |
| **CISA** | Cyber Alerts | Free | No | ✅ Operational (RSS) |
| **AISHub** | Marine Traffic | Free | No | ✅ Operational |
| **GDELT** | Global Events | Free | No | ⚠️ API changed |
| **ACLED** | Armed Conflict | Free* | Yes | ❌ Needs key |
| **Sentinel-2** | Satellite EO | Free | No | ❌ Needs config |
| **MISP** | Threat Sharing | Self-hosted | Yes | ❌ Needs instance |
| **Twitter/X** | Social Media | Paid | Yes | ❌ Needs key |
| **Abuse.ch** | Malware Feeds | Free | No | ⚠️ Intermittent |

> **7 sources integrated.** 4 operational with the provided keys. Remaining sources require additional API credentials or infrastructure.

---

## NLP Pipeline

The optional Python microservice provides deep text enrichment:

| Capability | Model | Description |
|-----------|-------|-------------|
| **Zero-shot Classification** | BART-Large-MNLI | Classifies events into 5 geopolitical categories |
| **Named Entity Recognition** | spaCy `en_core_web_lg` | Extracts persons, organizations, locations, dates |
| **Sentiment Analysis** | DistilBERT | Polarity scoring for escalation prediction |
| **Geocoding** | Nominatim (OSM) | Converts location names to coordinates |
| **Keyword Extraction** | TF-IDF + Lemmatization | Topic extraction with stopword filtering |

**Fallback mode:** When the NLP service is unavailable, the backend uses a lightweight JavaScript NLP engine with keyword-based classification, cached geocoding, and heuristic confidence scoring.

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | All events with optional filters (`type`, `source`, `minConfidence`) |
| `/api/events/:id` | GET | Single event detail |
| `/api/metrics` | GET | Platform metrics (precision, reactivity, reliability) |
| `/api/timeline` | GET | Temporal correlation nodes |
| `/api/admin/ingestion/stats` | GET | Ingestion statistics per source |
| `/api/admin/ingestion/trigger/:source` | POST | Trigger manual re-ingestion |
| `/api/admin/ingestion/start` | POST | Start ingestion orchestrator |
| `/api/admin/ingestion/stop` | POST | Stop ingestion orchestrator |

Full reference: [`docs/API.md`](docs/API.md)

---

## Project Structure

```
orion-sentinel/
├── frontend/                  # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # MapPanel, NewsFeed, Timeline, Metrics, Header
│   │   ├── hooks/             # useOSINTData, useWebSocket
│   │   ├── types/             # TypeScript interfaces
│   │   └── styles/            # Tailwind CSS
│   ├── vite.config.ts
│   └── package.json
├── backend/                   # Node.js 20 + Express
│   ├── services/              # Data source integrations, NLP, queue
│   │   ├── ingestion.js       # Orchestrator (interval-based polling)
│   │   ├── nlp.js             # Lightweight JS NLP (fallback)
│   │   ├── newsapi.js         # NewsAPI.org integration
│   │   ├── cyber.js           # CISA, OTX, MISP, URLhaus
│   │   ├── marinetraffic.js   # AISHub vessel tracking
│   │   ├── gdelt.js           # GDELT Project
│   │   ├── acled.js           # Armed Conflict Location & Event Data
│   │   ├── satellite.js       # Sentinel-2 / Planet Labs
│   │   ├── social.js          # Twitter, Reddit
│   │   ├── validation.js      # Input sanitization
│   │   └── queue.js           # Background job queue
│   ├── routes/                # API route handlers
│   ├── utils/                 # HTTP client, normalizer, logger
│   └── server.js
├── nlp-service/               # Python FastAPI microservice
│   ├── main.py                # spaCy + Transformers pipeline
│   └── requirements.txt
├── nginx/                     # Reverse proxy config
├── docs/                      # API & data source documentation
├── docker-compose.yml
├── run-local.sh               # macOS/Linux launcher
├── run-local.bat              # Windows launcher
└── LOCAL_SETUP.md             # Detailed setup guide
```

---

## Tech Stack

**Frontend** · React 18 · TypeScript · Vite · Leaflet · Tailwind CSS · Socket.io Client · date-fns · Lucide Icons

**Backend** · Node.js 20 · Express 4 · Socket.io 4 · node-cron · Helmet · express-rate-limit

**NLP** · Python 3.11 · FastAPI · spaCy · HuggingFace Transformers · BART · DistilBERT · uv

**Infrastructure** · Docker · Nginx · PostgreSQL + PostGIS (optional) · Redis (optional)

---

## Security

- HTTP security headers via Helmet.js
- Rate limiting: 100 requests per 15 minutes per IP
- CORS restricted to configured origins
- SQL injection protection via parameterized queries
- XSS prevention through React's automatic escaping
- Environment-based API key management
- All secrets excluded from version control

---

## License

MIT License. See `LICENSE` for details.

---

<div align="center">
  <p>Built with precision, reactivity, reliability, and accessibility.</p>
  <p><strong>🛰️ ORION SENTINEL — See what others miss.</strong></p>
</div>
