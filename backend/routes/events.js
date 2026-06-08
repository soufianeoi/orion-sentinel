const express = require('express');
const router = express.Router();
const { events } = require('../data/mockEvents');

// GET /api/events - List all events with optional filtering
router.get('/', (req, res) => {
  const { type, region, source, minConfidence, limit = 50 } = req.query;

  let filtered = [...events];

  if (type) filtered = filtered.filter(e => e.type === type);
  if (region) filtered = filtered.filter(e => e.region.toLowerCase().includes(region.toLowerCase()));
  if (source) filtered = filtered.filter(e => e.source.toLowerCase().includes(source.toLowerCase()));
  if (minConfidence) filtered = filtered.filter(e => e.confidence >= parseInt(minConfidence));

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(filtered.slice(0, parseInt(limit)));
});

// GET /api/events/:id - Single event detail
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// GET /api/events/stats/summary - Aggregation stats
router.get('/stats/summary', (req, res) => {
  const stats = {
    total: events.length,
    byType: {},
    byRegion: {},
    avgConfidence: 0,
    sources: [...new Set(events.map(e => e.source))],
  };

  events.forEach(e => {
    stats.byType[e.type] = (stats.byType[e.type] || 0) + 1;
    stats.byRegion[e.region] = (stats.byRegion[e.region] || 0) + 1;
    stats.avgConfidence += e.confidence;
  });

  stats.avgConfidence = (stats.avgConfidence / events.length).toFixed(1);

  res.json(stats);
});

module.exports = router;
