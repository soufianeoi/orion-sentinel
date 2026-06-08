const { v4: uuidv4 } = require('crypto').randomUUID;

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();

const events = [
  {
    id: 'evt-001',
    title: "Naval Exercise Detected in South China Sea",
    excerpt: "Satellite imagery confirms increased naval activity near disputed waters. Three destroyer-class vessels identified via SAR imaging.",
    content: "Synthetic Aperture Radar (SAR) satellite passes at 04:30 UTC detected three Luyang-class destroyers and one replenishment vessel operating 120nm from contested features. AIS data gaps correlate with military exercise patterns. Regional maritime authorities issued NOTAM warnings for live-fire drills in adjacent airspace.",
    source: "Janes",
    sourceReliability: 94,
    timestamp: hoursAgo(2),
    type: "conflict",
    coordinates: [14.5, 115.2],
    tags: ["Naval", "Indo-Pacific", "SAR", "AIS"],
    confidence: 92,
    region: "Indo-Pacific"
  },
  {
    id: 'evt-002',
    title: "EU Sanctions Package Vote Scheduled",
    excerpt: "European Parliament prepares for final vote on expanded sanctions regime targeting energy sector entities and dual-use technology exports.",
    content: "The proposed sanctions package includes asset freezes on 47 individuals and 12 entities, plus restrictions on liquefied natural gas technology transfers. Vote scheduled for 14:00 CET. Diplomatic sources suggest near-unanimous support among member states.",
    source: "Reuters",
    sourceReliability: 97,
    timestamp: hoursAgo(3),
    type: "diplomatic",
    coordinates: [50.85, 4.35],
    tags: ["EU", "Sanctions", "Energy", "Trade"],
    confidence: 88,
    region: "Europe"
  },
  {
    id: 'evt-003',
    title: "Critical Infrastructure Alert: Power Grid",
    excerpt: "Anomalous network traffic detected near Eastern European power distribution facilities. No service disruption reported at this time.",
    content: "CISA and regional CERT teams detected reconnaissance activity targeting SCADA systems at three substations. Traffic patterns match known APT29 tooling. Defensive measures activated. No evidence of payload delivery. Grid operators placed on elevated alert status.",
    source: "CISA",
    sourceReliability: 99,
    timestamp: hoursAgo(4),
    type: "cyber",
    coordinates: [52.2, 21.0],
    tags: ["Cyber", "Infrastructure", "SCADA", "APT"],
    confidence: 85,
    region: "Eastern Europe"
  },
  {
    id: 'evt-004',
    title: "Rare Earth Export Quotas Announced",
    excerpt: "Ministry of Commerce issues Q3 export restrictions on gallium and germanium processing technologies, citing national security.",
    content: "New export licensing requirements effective immediately for gallium substrates and germanium dioxide. Export volumes expected to drop 40% quarter-over-quarter. Semiconductor supply chain analysts warn of downstream price impacts on RF components and fiber optics.",
    source: "Bloomberg",
    sourceReliability: 95,
    timestamp: hoursAgo(5),
    type: "economic",
    coordinates: [39.9, 116.4],
    tags: ["Trade", "Materials", "Tech", "Supply Chain"],
    confidence: 96,
    region: "East Asia"
  },
  {
    id: 'evt-005',
    title: "Diplomatic Talks Resume in Geneva",
    excerpt: "Multilateral negotiations on arms control framework enter third day with cautious optimism from delegates.",
    content: "Technical working groups reached preliminary agreement on verification protocols for hypersonic glide vehicle testing. Remaining sticking points include data sharing thresholds and on-site inspection frequencies. Plenary session scheduled for tomorrow morning.",
    source: "AFP",
    sourceReliability: 91,
    timestamp: hoursAgo(6),
    type: "diplomatic",
    coordinates: [46.2, 6.1],
    tags: ["Diplomacy", "Arms", "UN", "Geneva"],
    confidence: 78,
    region: "Europe"
  },
  {
    id: 'evt-006',
    title: "Border Clash Reported in Eastern Region",
    excerpt: "Exchange of fire reported along demarcation line. Both sides accuse other of provocation. Casualties unconfirmed.",
    content: "Local media report small arms and mortar fire along 8km section of the Line of Contact starting at 06:15 local time. Each side claims the other initiated hostilities. OSCE monitoring mission attempting to access the area. Independent verification pending due to access restrictions.",
    source: "BBC",
    sourceReliability: 93,
    timestamp: hoursAgo(7),
    type: "conflict",
    coordinates: [40.1, 46.7],
    tags: ["Border", "Conflict", "OSCE", "Alert"],
    confidence: 72,
    region: "Caucasus"
  },
  {
    id: 'evt-007',
    title: "Central Bank Digital Currency Pilot Expansion",
    excerpt: "Monetary authority announces expanded CBDC testing phase involving cross-border settlement with three partner jurisdictions.",
    content: "The pilot will test wholesale CBDC corridors for commodity trade settlement. Technical infrastructure provided by consortium of domestic fintech firms. IMF and BIS observing as technical advisors. Full rollout targeted for Q2 2027 if pilot succeeds.",
    source: "FT",
    sourceReliability: 96,
    timestamp: hoursAgo(8),
    type: "economic",
    coordinates: [1.35, 103.8],
    tags: ["Finance", "CBDC", "Fintech", "Cross-Border"],
    confidence: 89,
    region: "Southeast Asia"
  },
  {
    id: 'evt-008',
    title: "Supply Chain Disruption: Strait Transit",
    excerpt: "Shipping delays reported due to increased inspection protocols. Container throughput down 15% week-over-week.",
    content: "Maritime insurers report 47 vessels waiting at anchorage for customs inspection, up from normal 12-vessel average. Inspection regime reportedly targeting dual-use goods and advanced semiconductors. Maersk and MSC announce schedule adjustments for Asia-Europe routes.",
    source: "Lloyd's",
    sourceReliability: 92,
    timestamp: hoursAgo(9),
    type: "economic",
    coordinates: [26.5, 56.2],
    tags: ["Shipping", "Trade", "Logistics", "Insurance"],
    confidence: 84,
    region: "Middle East"
  },
  {
    id: 'evt-009',
    title: "Arctic Military Base Construction Accelerates",
    excerpt: "Satellite imagery reveals expanded runway and new hangar facilities at northern installation.",
    content: "Maxar imagery from June 5 shows 500m runway extension and three new hardened aircraft shelters under construction. Ice-class resupply vessel docked at adjacent port facility. Activity level suggests operational readiness target of September 2026.",
    source: "Maxar",
    sourceReliability: 98,
    timestamp: hoursAgo(10),
    type: "conflict",
    coordinates: [73.5, 80.5],
    tags: ["Arctic", "Military", "Satellite", "Infrastructure"],
    confidence: 95,
    region: "Arctic"
  },
  {
    id: 'evt-010',
    title: "Climate Event: Drought Emergency Declaration",
    excerpt: "Government declares state of emergency as reservoir levels fall below critical thresholds.",
    content: "Hydroelectric output reduced 30% due to depleted reservoirs. Agricultural ministry warns of 40% crop yield reduction for staple grains. International relief organizations placed on standby. El Niño pattern cited as primary driver by meteorological agency.",
    source: "ReliefWeb",
    sourceReliability: 90,
    timestamp: hoursAgo(11),
    type: "environmental",
    coordinates: [-15.8, -47.9],
    tags: ["Climate", "Agriculture", "Water", "Emergency"],
    confidence: 91,
    region: "South America"
  }
];

module.exports = { events };
