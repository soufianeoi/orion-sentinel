/**
 * Unified Ingestion Orchestrator
 * Coordinates all data sources, applies NLP, deduplicates, and broadcasts to clients
 */
const { GDELTService } = require('./gdelt');
const { ACLEDService } = require('./acled');
const { NewsAPIService } = require('./newsapi');
const { SatelliteService } = require('./satellite');
const { MarineTrafficService } = require('./marinetraffic');
const { SocialMediaService } = require('./social');
const { CyberIntelService } = require('./cyber');
const { NLPEngine } = require('./nlp');
const { DataNormalizer } = require('../utils/normalizer');
const { randomUUID: uuidv4 } = require('crypto');

class IngestionOrchestrator {
  constructor(io, db = null) {
    this.io = io;
    this.db = db; // PostgreSQL connection (optional for now)
    this.nlp = new NLPEngine();

    // Initialize all services
    this.services = {
      gdelt: new GDELTService(),
      acled: new ACLEDService(),
      news: new NewsAPIService(),
      satellite: new SatelliteService(),
      marine: new MarineTrafficService(),
      social: new SocialMediaService(),
      cyber: new CyberIntelService(),
    };

    this.eventStore = new Map(); // In-memory store (replace with DB in production)
    this.processedIds = new Set(); // Deduplication
    this.ingestionStats = {
      totalEvents: 0,
      bySource: {},
      lastIngestion: null,
      errors: 0,
    };

    this.isRunning = false;
    this.intervals = [];
  }

  /**
   * Start all ingestion pipelines with different schedules
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🔄 Ingestion orchestrator starting...');

    // GDELT: Every 15 minutes (matches their update cycle)
    this.intervals.push(setInterval(() => this.ingestSource('gdelt'), 15 * 60 * 1000));

    // ACLED: Every 6 hours (daily updates)
    this.intervals.push(setInterval(() => this.ingestSource('acled'), 6 * 60 * 60 * 1000));

    // News APIs: Every 30 minutes
    this.intervals.push(setInterval(() => this.ingestSource('news'), 30 * 60 * 1000));

    // Satellite: Every 12 hours (EO data isn't real-time)
    this.intervals.push(setInterval(() => this.ingestSource('satellite'), 12 * 60 * 60 * 1000));

    // MarineTraffic: Every 10 minutes (AIS is near real-time)
    this.intervals.push(setInterval(() => this.ingestSource('marine'), 10 * 60 * 1000));

    // Social Media: Every 5 minutes (high frequency)
    this.intervals.push(setInterval(() => this.ingestSource('social'), 5 * 60 * 1000));

    // Cyber: Every 20 minutes
    this.intervals.push(setInterval(() => this.ingestSource('cyber'), 20 * 60 * 1000));

    // Run initial ingestion immediately
    this.runInitialIngestion();
  }

  stop() {
    this.isRunning = false;
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    console.log('⏹️ Ingestion orchestrator stopped');
  }

  async runInitialIngestion() {
    console.log('🚀 Running initial ingestion from all sources...');
    const sources = ['gdelt', 'acled', 'news', 'satellite', 'marine', 'social', 'cyber'];

    for (const source of sources) {
      try {
        await this.ingestSource(source);
      } catch (err) {
        console.error(`Initial ingestion failed for ${source}:`, err.message);
      }
      // Small delay between sources to avoid rate limit conflicts
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log('✅ Initial ingestion complete');
  }

  async ingestSource(sourceName) {
    const startTime = Date.now();
    let events = [];

    try {
      switch (sourceName) {
        case 'gdelt':
          events = await this.services.gdelt.fetchLatestEvents();
          break;
        case 'acled':
          events = await this.services.acled.fetchRecentEvents(7, 50);
          break;
        case 'news':
          events = await this.services.news.fetchAll();
          break;
        case 'satellite':
          // Search for recent changes in key areas
          events = await this.services.satellite.searchSentinel(
            '20,100,40,120', // SE Asia bbox
            new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          );
          break;
        case 'marine':
          events = await this.services.marine.fetchAISHub(50);
          break;
        case 'social':
          events = await this.services.social.fetchAll();
          break;
        case 'cyber':
          events = await this.services.cyber.fetchAll();
          break;
      }

      // Process and enrich events
      const processed = await this.processEvents(events, sourceName);

      // Store and broadcast
      this.storeEvents(processed);
      this.broadcastEvents(processed);

      // Update stats
      this.ingestionStats.totalEvents += processed.length;
      this.ingestionStats.bySource[sourceName] = (this.ingestionStats.bySource[sourceName] || 0) + processed.length;
      this.ingestionStats.lastIngestion = new Date().toISOString();

      const duration = Date.now() - startTime;
      console.log(`✅ ${sourceName}: ingested ${processed.length} events in ${duration}ms`);

    } catch (err) {
      this.ingestionStats.errors++;
      console.error(`❌ ${sourceName} ingestion failed:`, err.message);
    }
  }

  async processEvents(events, sourceName) {
    const processed = [];

    for (const event of events) {
      // Deduplication check
      const dedupKey = event.externalId || event.title;
      if (this.processedIds.has(dedupKey)) continue;
      this.processedIds.add(dedupKey);

      // Skip if missing critical fields
      if (!event.title || !event.source) continue;

      // NLP enrichment
      const text = `${event.title} ${event.excerpt || ''} ${event.content || ''}`;

      // Classify event type if not set or generic
      if (!event.eventType || event.eventType === 'diplomatic') {
        event.eventType = this.nlp.classifyEventType(text);
      }

      // Extract entities
      const entities = this.nlp.extractEntities(text);
      if (entities.organizations.length > 0) {
        event.tags = [...new Set([...event.tags, ...entities.organizations])];
      }

      // Geocode if missing coordinates
      if (!event.coordinates) {
        const locationName = event.region || entities.locations[0];
        if (locationName) {
          const geo = await this.nlp.geocodeLocation(locationName);
          if (geo) {
            event.coordinates = [geo.lat, geo.lon];
            event.region = event.region || geo.displayName;
          }
        }
      }

      // Calculate confidence score
      event.confidence = this.nlp.calculateConfidence(event);

      // Sentiment analysis
      event.sentiment = this.nlp.sentimentScore(text);

      // Add metadata
      event.id = `evt-${uuidv4()}`;
      event.ingestedAt = new Date().toISOString();
      event.ingestionSource = sourceName;
      event.type = event.eventType;

      // Limit store size (keep last 5000 events)
      if (this.eventStore.size > 5000) {
        const firstKey = this.eventStore.keys().next().value;
        this.eventStore.delete(firstKey);
      }

      processed.push(event);
    }

    return processed;
  }

  storeEvents(events) {
    for (const event of events) {
      this.eventStore.set(event.id, event);

      // Persist to DB if available
      if (this.db) {
        this._persistToDB(event).catch(err => 
          console.error('DB persist failed:', err.message)
        );
      }
    }
  }

  async _persistToDB(event) {
    // In production, use parameterized queries
    // Example: INSERT INTO events (...) VALUES (...) ON CONFLICT DO UPDATE
    // For now, just a placeholder
  }

  broadcastEvents(events) {
    if (!this.io || events.length === 0) return;

    // Broadcast to all connected clients
    events.forEach(event => {
      this.io.emit('osint-event', event);

      // Also emit to region-specific rooms
      if (event.region) {
        const room = `region:${event.region.replace(/\s+/g, '_')}`;
        this.io.to(room).emit('osint-event', event);
      }
    });

    // Update metrics
    this.io.emit('metrics-update', {
      totalEvents: this.ingestionStats.totalEvents,
      sourcesActive: Object.keys(this.ingestionStats.bySource).length,
      lastIngestion: this.ingestionStats.lastIngestion,
    });
  }

  getEvents(filter = {}) {
    let events = Array.from(this.eventStore.values());

    if (filter.type) events = events.filter(e => e.type === filter.type || e.eventType === filter.type);
    if (filter.region) events = events.filter(e => e.region?.toLowerCase().includes(filter.region.toLowerCase()));
    if (filter.source) events = events.filter(e => e.source?.toLowerCase().includes(filter.source.toLowerCase()));
    if (filter.minConfidence) events = events.filter(e => e.confidence >= filter.minConfidence);

    // Sort by timestamp desc
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return events;
  }

  getStats() {
    return {
      ...this.ingestionStats,
      storeSize: this.eventStore.size,
      isRunning: this.isRunning,
    };
  }
}

module.exports = { IngestionOrchestrator };
