const express = require('express');
const router = express.Router();
const { events } = require('../data/mockEvents');

router.get('/', (req, res) => {
  const now = new Date();

  const nodes = [
    {
      id: 'tl-001',
      timestamp: new Date(now - 18 * 3600000).toISOString(),
      title: 'Early Warning Signal',
      description: 'Automated OSINT scrapers detect anomalous social media activity and vessel AIS gaps in 3 regions. Bayesian classifier flags elevated probability.',
      eventIds: ['evt-001', 'evt-006'],
      correlation: 0.78,
    },
    {
      id: 'tl-002',
      timestamp: new Date(now - 12 * 3600000).toISOString(),
      title: 'News Correlation',
      description: 'Cross-referencing satellite SAR data with ground reports and maritime traffic confirms military exercise patterns and border mobilization.',
      eventIds: ['evt-001', 'evt-006', 'evt-009'],
      correlation: 0.85,
    },
    {
      id: 'tl-003',
      timestamp: new Date(now - 6 * 3600000).toISOString(),
      title: 'Alert Escalation',
      description: 'Confidence threshold reached on 4 events. Automated notifications dispatched to subscribed analysts and regional bureaus.',
      eventIds: ['evt-001', 'evt-003', 'evt-004', 'evt-006'],
      correlation: 0.91,
    },
    {
      id: 'tl-004',
      timestamp: new Date(now - 2 * 3600000).toISOString(),
      title: 'Verification Complete',
      description: 'Third-party satellite provider and diplomatic cables confirm initial assessments. Reliability score updated to 96%.',
      eventIds: ['evt-001', 'evt-002', 'evt-004'],
      correlation: 0.94,
    },
  ];

  res.json(nodes);
});

module.exports = router;
