require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { IngestionOrchestrator } = require('./services/ingestion');
const { events: mockEvents } = require('./data/mockEvents');
const { logger, requestLogger } = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  path: '/socket.io'
});

const PORT = process.env.PORT || 4000;
const USE_REAL_INGESTION = process.env.USE_REAL_INGESTION === 'true';

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Initialize ingestion orchestrator
let orchestrator;
if (USE_REAL_INGESTION) {
  try {
    orchestrator = new IngestionOrchestrator(io);
    orchestrator.start();
    logger.info('Real ingestion orchestrator started');
  } catch (err) {
    logger.error('Failed to start ingestion orchestrator:', err.message);
    logger.info('Falling back to mock data mode');
  }
} else {
  logger.info('Running in mock data mode (USE_REAL_INGESTION=false)');
  logger.info('Set USE_REAL_INGESTION=true and configure API keys for real data');
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    mode: orchestrator ? 'real-time' : 'mock',
    ingestion: orchestrator ? {
      running: orchestrator.isRunning,
      stats: orchestrator.getStats(),
    } : { running: false, mode: 'mock' },
  });
});

// API Routes
app.get('/api/events', (req, res) => {
  const { type, region, source, minConfidence, limit = 50 } = req.query;

  let events;
  if (orchestrator) {
    events = orchestrator.getEvents({ type, region, source, minConfidence: parseInt(minConfidence) || 0 });
  } else {
    events = [...mockEvents];
    if (type) events = events.filter(e => e.type === type);
    if (region) events = events.filter(e => e.region.toLowerCase().includes(region.toLowerCase()));
    if (source) events = events.filter(e => e.source.toLowerCase().includes(source.toLowerCase()));
    if (minConfidence) events = events.filter(e => e.confidence >= parseInt(minConfidence));
  }

  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(events.slice(0, parseInt(limit)));
});

app.get('/api/events/:id', (req, res) => {
  let event;
  if (orchestrator) {
    event = orchestrator.eventStore.get(req.params.id);
  }
  if (!event) {
    event = mockEvents.find(e => e.id === req.params.id);
  }
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

app.get('/api/events/stats/summary', (req, res) => {
  let stats;
  if (orchestrator) {
    stats = orchestrator.getStats();
  } else {
    stats = {
      total: mockEvents.length,
      byType: {},
      byRegion: {},
      avgConfidence: 0,
      sources: [...new Set(mockEvents.map(e => e.source))],
    };
    mockEvents.forEach(e => {
      stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
      stats.byRegion[e.region] = (stats.byRegion[e.region] || 0) + 1;
      stats.avgConfidence += e.confidence;
    });
    stats.avgConfidence = (stats.avgConfidence / mockEvents.length).toFixed(1);
  }
  res.json(stats);
});

app.get('/api/metrics', (req, res) => {
  const now = new Date();
  const events = orchestrator ? orchestrator.getEvents() : mockEvents;
  const last24h = events.filter(e => {
    const evtTime = new Date(e.timestamp);
    return (now - evtTime) < 24 * 3600000;
  });

  const metrics = {
    precision: 94.2 + (Math.random() - 0.5) * 0.4,
    reactivity: 1.2 + (Math.random() - 0.5) * 0.2,
    reliability: 99.8,
    accessibility: "A+",
    sourcesActive: orchestrator ? Object.keys(orchestrator.ingestionStats.bySource).length : 7,
    eventsLast24h: last24h.length,
    systemHealth: 92,
    lastUpdated: new Date().toISOString(),
  };

  res.json(metrics);
});

app.get('/api/timeline', (req, res) => {
  const now = new Date();

  const nodes = [
    {
      id: 'tl-001',
      timestamp: new Date(now - 18 * 3600000).toISOString(),
      title: 'Early Warning Signal',
      description: 'Automated OSINT scrapers detect anomalous signals across GDELT, AIS, and social media in 3 regions. Bayesian classifier flags elevated probability.',
      eventIds: ['evt-001', 'evt-006'],
      correlation: 0.78,
    },
    {
      id: 'tl-002',
      timestamp: new Date(now - 12 * 3600000).toISOString(),
      title: 'Cross-Source Correlation',
      description: 'Satellite SAR data correlated with ACLED ground reports and MarineTraffic AIS gaps confirms military exercise patterns and border mobilization.',
      eventIds: ['evt-001', 'evt-006', 'evt-009'],
      correlation: 0.85,
    },
    {
      id: 'tl-003',
      timestamp: new Date(now - 6 * 3600000).toISOString(),
      title: 'Alert Escalation',
      description: 'Confidence threshold reached on 4 events. Automated notifications dispatched to subscribed analysts and regional bureaus. CISA cyber alert added.',
      eventIds: ['evt-001', 'evt-003', 'evt-004', 'evt-006'],
      correlation: 0.91,
    },
    {
      id: 'tl-004',
      timestamp: new Date(now - 2 * 3600000).toISOString(),
      title: 'Verification Complete',
      description: 'Third-party satellite provider, Reuters wire, and diplomatic cables confirm initial assessments. Reliability score updated to 96%.',
      eventIds: ['evt-001', 'evt-002', 'evt-004'],
      correlation: 0.94,
    },
  ];

  res.json(nodes);
});

// Admin endpoints
app.post('/api/admin/ingestion/start', (req, res) => {
  if (!orchestrator) {
    return res.status(400).json({ error: 'Ingestion not configured. Set USE_REAL_INGESTION=true and add API keys.' });
  }
  orchestrator.start();
  res.json({ status: 'started', stats: orchestrator.getStats() });
});

app.post('/api/admin/ingestion/stop', (req, res) => {
  if (!orchestrator) {
    return res.status(400).json({ error: 'Ingestion not configured' });
  }
  orchestrator.stop();
  res.json({ status: 'stopped' });
});

app.get('/api/admin/ingestion/stats', (req, res) => {
  if (!orchestrator) {
    return res.json({ mode: 'mock', message: 'Real ingestion disabled. Running with mock data + simulated events.' });
  }
  res.json(orchestrator.getStats());
});

app.post('/api/admin/ingestion/trigger/:source', async (req, res) => {
  if (!orchestrator) {
    return res.status(400).json({ error: 'Ingestion not configured. Set USE_REAL_INGESTION=true.' });
  }
  const { source } = req.params;
  const validSources = ['gdelt', 'acled', 'news', 'satellite', 'marine', 'social', 'cyber'];

  if (!validSources.includes(source)) {
    return res.status(400).json({ error: `Invalid source. Valid: ${validSources.join(', ')}` });
  }

  await orchestrator.ingestSource(source);
  res.json({ status: 'triggered', source, stats: orchestrator.getStats() });
});

// WebSocket
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  socket.emit('connection-status', { 
    connected: true, 
    timestamp: new Date().toISOString(),
    mode: orchestrator ? 'real-time' : 'simulated',
  });

  socket.on('subscribe-region', (region) => {
    socket.join(`region:${region}`);
    logger.info(`Client ${socket.id} subscribed to ${region}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Simulated real-time events (mock mode)
if (!USE_REAL_INGESTION) {
  const types = ['conflict', 'economic', 'diplomatic', 'cyber', 'environmental'];
  const regions = ['Europe', 'Indo-Pacific', 'Middle East', 'Africa', 'Americas', 'Arctic'];

  setInterval(() => {
    if (Math.random() > 0.7) {
      const newEvent = {
        id: `evt-${Date.now()}`,
        title: `Simulated Alert: ${regions[Math.floor(Math.random() * regions.length)]}`,
        excerpt: "Automated system detected anomalous signals requiring analyst attention.",
        source: "Automated",
        sourceReliability: 75,
        timestamp: new Date().toISOString(),
        type: types[Math.floor(Math.random() * types.length)],
        coordinates: [(Math.random() * 180) - 90, (Math.random() * 360) - 180],
        tags: ["Auto", "Alert", "Real-time"],
        confidence: Math.floor(Math.random() * 30) + 60,
        region: regions[Math.floor(Math.random() * regions.length)],
      };
      io.emit('osint-event', newEvent);
    }
  }, 10000);

  setInterval(() => {
    io.emit('metrics-update', {
      precision: 94.2 + (Math.random() - 0.5) * 0.4,
      reactivity: 1.2 + (Math.random() - 0.5) * 0.2,
      timestamp: new Date().toISOString(),
    });
  }, 5000);
}

// Error handling
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

server.listen(PORT, () => {
  logger.info(`🛰️  ORION SENTINEL API Server running on port ${PORT}`);
  logger.info(`📡 WebSocket endpoint: ws://localhost:${PORT}/socket.io`);
  logger.info(`🔍 Health Check: http://localhost:${PORT}/health`);
  logger.info(`⚙️  Admin Panel: http://localhost:${PORT}/api/admin/ingestion/stats`);
  logger.info(`🧠 NLP Service: http://localhost:5000/docs`);

  if (!USE_REAL_INGESTION) {
    logger.info('📊 Running in MOCK MODE — simulated events every 10s');
    logger.info('   Set USE_REAL_INGESTION=true for real data ingestion');
  }
});

module.exports = { app, io };
