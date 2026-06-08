const express = require('express');
const router = express.Router();
const { events } = require('../data/mockEvents');

router.get('/', (req, res) => {
  const now = new Date();
  const last24h = events.filter(e => {
    const evtTime = new Date(e.timestamp);
    return (now - evtTime) < 24 * 3600000;
  });

  const metrics = {
    precision: 94.2 + (Math.random() - 0.5) * 0.4,
    reactivity: 1.2 + (Math.random() - 0.5) * 0.2,
    reliability: 99.8,
    accessibility: "A+",
    sourcesActive: 847,
    eventsLast24h: last24h.length,
    systemHealth: 92,
    lastUpdated: new Date().toISOString(),
  };

  res.json(metrics);
});

module.exports = router;
