/**
 * Normalizes raw data from various sources into unified OSINTEvent format
 */
class DataNormalizer {
  static normalizeGDELT(raw) {
    return {
      externalId: `gdelt-${raw.GLOBALEVENTID}`,
      title: this._truncate(raw.SOURCEURL ? raw.SOURCEURL.split('/').pop().replace(/-/g, ' ') : 'GDELT Event', 200),
      excerpt: raw.Actor1Name && raw.Actor2Name 
        ? `${raw.Actor1Name} → ${raw.Actor2Name} (${raw.EventCode})` 
        : 'Geopolitical event detected via GDELT',
      content: null,
      source: 'GDELT',
      sourceReliability: 85,
      eventType: this._mapGDELTType(raw.EventCode),
      confidence: this._gdeltConfidence(raw),
      region: raw.Actor1Geo_FullName || raw.Actor2Geo_FullName || 'Global',
      coordinates: raw.Actor1Geo_Lat && raw.Actor1Geo_Long 
        ? [parseFloat(raw.Actor1Geo_Lat), parseFloat(raw.Actor1Geo_Long)]
        : null,
      tags: ['GDELT', raw.EventCode, raw.Actor1Name, raw.Actor2Name].filter(Boolean),
      raw: raw,
    };
  }

  static normalizeACLED(raw) {
    return {
      externalId: `acled-${raw.event_id_cnty}`,
      title: `${raw.event_type}: ${raw.actor1 || 'Unknown'}`,
      excerpt: raw.notes ? raw.notes.slice(0, 300) : `${raw.event_type} in ${raw.location}`,
      content: raw.notes || null,
      source: 'ACLED',
      sourceReliability: 92,
      eventType: this._mapACLEDType(raw.event_type),
      confidence: raw.fatalities > 0 ? 90 : 75,
      region: raw.region || raw.country,
      coordinates: raw.latitude && raw.longitude 
        ? [parseFloat(raw.latitude), parseFloat(raw.longitude)]
        : null,
      tags: ['ACLED', raw.event_type, raw.actor1, raw.country].filter(Boolean),
      raw: raw,
    };
  }

  static normalizeNewsAPI(raw, provider) {
    return {
      externalId: `news-${Buffer.from(raw.url || raw.link || '').toString('base64').slice(0, 20)}`,
      title: raw.title || 'Untitled',
      excerpt: raw.description ? raw.description.slice(0, 300) : '',
      content: raw.content || null,
      source: provider || raw.source?.name || 'NewsAPI',
      sourceReliability: this._newsReliability(provider),
      eventType: 'diplomatic', // Default, NLP will refine
      confidence: 70,
      region: null, // Will be geocoded
      coordinates: null,
      tags: ['News', provider, ...(raw.keywords || [])].filter(Boolean),
      raw: raw,
    };
  }

  static normalizeCISA(raw) {
    return {
      externalId: `cisa-${raw.id || raw.identifier}`,
      title: raw.title || 'CISA Alert',
      excerpt: raw.summary ? raw.summary.slice(0, 300) : raw.description?.slice(0, 300) || '',
      content: raw.description || null,
      source: 'CISA',
      sourceReliability: 99,
      eventType: 'cyber',
      confidence: 95,
      region: 'United States',
      coordinates: [38.9072, -77.0369], // DC
      tags: ['CISA', 'Cyber', raw.severity, ...(raw.products || [])].filter(Boolean),
      raw: raw,
    };
  }

  static normalizeMISP(raw) {
    return {
      externalId: `misp-${raw.Event?.id}`,
      title: raw.Event?.info || 'MISP Event',
      excerpt: `Threat intel: ${raw.Event?.info?.slice(0, 300)}`,
      content: null,
      source: 'MISP',
      sourceReliability: 88,
      eventType: 'cyber',
      confidence: 80,
      region: null,
      coordinates: null,
      tags: ['MISP', 'ThreatIntel', ...(raw.Event?.Tag?.map(t => t.name) || [])].filter(Boolean),
      raw: raw,
    };
  }

  static normalizeAIS(raw) {
    return {
      externalId: `ais-${raw.mmsi || raw.imo || raw.shipid}`,
      title: `Vessel ${raw.shipname || raw.mmsi}: ${raw.status || 'Transit'}`,
      excerpt: `${raw.shiptype || 'Vessel'} at ${raw.speed || 0}kn, heading ${raw.course || 0}° near ${raw.port || 'open water'}`,
      content: null,
      source: 'MarineTraffic',
      sourceReliability: 90,
      eventType: 'economic',
      confidence: 85,
      region: raw.port || raw.area || 'Maritime',
      coordinates: raw.lat && raw.lon 
        ? [parseFloat(raw.lat), parseFloat(raw.lon)]
        : null,
      tags: ['AIS', 'Maritime', raw.shiptype, raw.flag].filter(Boolean),
      raw: raw,
    };
  }

  static normalizeSentinel(raw) {
    return {
      externalId: `sentinel-${raw.id}`,
      title: `Satellite Detection: ${raw.title || 'Anomaly'}`,
      excerpt: `EO change detected in ${raw.location || 'target area'}. Confidence: ${raw.confidence || 'N/A'}`,
      content: null,
      source: 'Sentinel-2',
      sourceReliability: 98,
      eventType: 'environmental',
      confidence: raw.confidence || 80,
      region: raw.location || 'Unknown',
      coordinates: raw.lat && raw.lon 
        ? [parseFloat(raw.lat), parseFloat(raw.lon)]
        : null,
      tags: ['Satellite', 'EO', 'ChangeDetection', raw.sensor].filter(Boolean),
      raw: raw,
    };
  }

  static normalizeTwitter(raw) {
    return {
      externalId: `x-${raw.id}`,
      title: `Social Signal: ${raw.text?.slice(0, 80)}...`,
      excerpt: raw.text?.slice(0, 300) || '',
      content: raw.text || null,
      source: 'X/Twitter',
      sourceReliability: 45, // Low by default, needs verification
      eventType: 'conflict', // Default, NLP refines
      confidence: 40,
      region: raw.place?.full_name || null,
      coordinates: raw.geo?.coordinates || null,
      tags: ['Social', 'X', ...(raw.entities?.hashtags?.map(h => h.tag) || [])].filter(Boolean),
      raw: raw,
    };
  }

  // Helpers
  static _truncate(str, len) {
    return str && str.length > len ? str.slice(0, len) + '...' : str;
  }

  static _mapGDELTType(code) {
    const map = {
      '010': 'conflict', '020': 'conflict', '030': 'conflict',
      '040': 'conflict', '050': 'conflict', '060': 'conflict',
      '070': 'conflict', '080': 'conflict', '090': 'conflict',
      '100': 'conflict', '110': 'conflict', '120': 'conflict',
      '130': 'conflict', '140': 'conflict', '150': 'conflict',
      '160': 'conflict', '170': 'conflict', '180': 'conflict',
      '190': 'conflict', '200': 'conflict',
      '021': 'economic', '023': 'economic', '031': 'economic',
      '033': 'economic', '061': 'economic', '063': 'economic',
      '071': 'economic', '073': 'economic', '081': 'economic',
      '083': 'economic', '091': 'economic', '093': 'economic',
      '101': 'economic', '103': 'economic', '111': 'economic',
      '113': 'economic', '121': 'economic', '123': 'economic',
      '131': 'economic', '133': 'economic', '141': 'economic',
      '143': 'economic', '151': 'economic', '153': 'economic',
      '161': 'economic', '163': 'economic', '171': 'economic',
      '173': 'economic', '181': 'economic', '183': 'economic',
      '191': 'economic', '193': 'economic', '201': 'economic',
      '0231': 'diplomatic', '0232': 'diplomatic', '0233': 'diplomatic',
      '0234': 'diplomatic',
    };
    return map[code] || 'diplomatic';
  }

  static _gdeltConfidence(raw) {
    let score = 60;
    if (raw.Actor1Geo_Lat && raw.Actor1Geo_Long) score += 15;
    if (raw.SOURCEURL) score += 10;
    if (raw.NumMentions > 10) score += 10;
    if (raw.Actor1Name && raw.Actor2Name) score += 5;
    return Math.min(score, 98);
  }

  static _mapACLEDType(type) {
    const map = {
      'Battles': 'conflict',
      'Violence against civilians': 'conflict',
      'Protests': 'diplomatic',
      'Riots': 'conflict',
      'Strategic developments': 'diplomatic',
      'Explosions/Remote violence': 'conflict',
    };
    return map[type] || 'conflict';
  }

  static _newsReliability(provider) {
    const map = {
      'Reuters': 97, 'AP': 97, 'AFP': 95, 'BBC': 93,
      'NewsAPI': 70, 'default': 70,
    };
    return map[provider] || map.default;
  }
}

module.exports = { DataNormalizer };
