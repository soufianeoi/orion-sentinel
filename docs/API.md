# ORION SENTINEL API Documentation

## Base URL
```
Development: http://localhost:4000
Production: https://api.orion-sentinel.io
```

## Authentication
All endpoints require an API key passed via header:
```
Authorization: Bearer <your-api-key>
```

---

## Events

### GET /api/events
Retrieve curated intelligence events.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| type | string | Filter by event type: `conflict`, `economic`, `diplomatic`, `cyber`, `environmental` | all |
| region | string | Filter by region name (partial match) | all |
| source | string | Filter by source name (partial match) | all |
| minConfidence | integer | Minimum confidence score (0-100) | 0 |
| limit | integer | Max results to return | 50 |

**Response:**
```json
{
  "events": [
    {
      "id": "evt-uuid",
      "title": "Naval Exercise Detected...",
      "excerpt": "Satellite imagery confirms...",
      "source": "Janes",
      "sourceReliability": 94,
      "timestamp": "2026-06-08T14:32:00Z",
      "type": "conflict",
      "coordinates": [14.5, 115.2],
      "tags": ["Naval", "Indo-Pacific", "SAR"],
      "confidence": 92,
      "region": "Indo-Pacific",
      "sentiment": -0.3
    }
  ]
}
```

### GET /api/events/:id
Retrieve a single event by ID.

### GET /api/events/stats/summary
Get aggregation statistics.

**Response:**
```json
{
  "total": 847,
  "byType": { "conflict": 234, "economic": 189, "diplomatic": 312, "cyber": 112 },
  "byRegion": { "Indo-Pacific": 156, "Europe": 203, "Middle East": 134 },
  "avgConfidence": 84.2,
  "sources": ["GDELT", "ACLED", "Reuters", "CISA", "Janes"]
}
```

---

## Metrics

### GET /api/metrics
Get real-time platform health metrics.

**Response:**
```json
{
  "precision": 94.2,
  "reactivity": 1.2,
  "reliability": 99.8,
  "accessibility": "A+",
  "sourcesActive": 847,
  "eventsLast24h": 156,
  "systemHealth": 92,
  "lastUpdated": "2026-06-08T18:45:00Z"
}
```

---

## Timeline

### GET /api/timeline
Get temporal correlation nodes.

**Response:**
```json
{
  "nodes": [
    {
      "id": "tl-001",
      "timestamp": "2026-06-08T00:00:00Z",
      "title": "Early Warning Signal",
      "description": "Automated OSINT scrapers detected...",
      "eventIds": ["evt-001", "evt-006"],
      "correlation": 0.78
    }
  ]
}
```

---

## Admin / Ingestion Control

### POST /api/admin/ingestion/start
Start the real-time ingestion pipeline.

### POST /api/admin/ingestion/stop
Stop the ingestion pipeline.

### GET /api/admin/ingestion/stats
Get ingestion statistics.

**Response:**
```json
{
  "totalEvents": 1247,
  "bySource": { "gdelt": 456, "acled": 234, "news": 312, "cyber": 245 },
  "storeSize": 5000,
  "isRunning": true,
  "errors": 3,
  "lastIngestion": "2026-06-08T18:45:00Z"
}
```

### POST /api/admin/ingestion/trigger/:source
Manually trigger ingestion for a specific source.

**Sources:** `gdelt`, `acled`, `news`, `satellite`, `marine`, `social`, `cyber`

---

## WebSocket Events

Connect to `ws://localhost:4000/socket.io`

### Client → Server
```javascript
// Subscribe to region updates
socket.emit('subscribe-region', 'Indo-Pacific');
```

### Server → Client
```javascript
// Real-time event
socket.on('osint-event', (event) => {
  console.log('New event:', event);
});

// Metrics update
socket.on('metrics-update', (metrics) => {
  console.log('Metrics:', metrics);
});

// Connection status
socket.on('connection-status', (status) => {
  console.log('Status:', status);
});
```

---

## NLP Microservice

### POST /classify
Classify event text into categories.

**Request:**
```json
{
  "text": "Naval exercise detected in South China Sea with three destroyers",
  "candidate_labels": ["conflict", "economic", "diplomatic", "cyber"]
}
```

**Response:**
```json
{
  "classification": "conflict",
  "confidence": 0.89,
  "all_scores": {
    "conflict": 0.89,
    "diplomatic": 0.06,
    "economic": 0.03,
    "cyber": 0.02
  }
}
```

### POST /extract-entities
Extract named entities from text.

### POST /sentiment
Analyze sentiment polarity.

### POST /enrich-event
Full enrichment pipeline (classification + entities + sentiment + keywords).
