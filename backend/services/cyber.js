/**
 * Cyber Threat Intelligence Ingestion
 * CISA: Free RSS feeds and API (https://www.cisa.gov/api/1)
 * MISP: REST API (self-hosted or community instances)
 * AlienVault OTX: Free API key
 * Abuse.ch: Free threat feeds (URLhaus, MalwareBazaar)
 */
const { HttpClient } = require('../utils/httpClient');
const { DataNormalizer } = require('../utils/normalizer');

class CyberIntelService {
  constructor() {
    this.mispUrl = process.env.MISP_URL;
    this.mispKey = process.env.MISP_API_KEY;
    this.otxKey = process.env.ALIENVAULT_OTX_KEY;

    this.client = new HttpClient({ rateLimitMs: 3000 });
  }

  /**
   * CISA Alerts & Bulletins (free, no key)
   * RSS: https://www.cisa.gov/news.xml
   * JSON API: https://www.cisa.gov/api/1/...
   */
  async fetchCISAAlerts() {
    try {
      // CISA provides RSS and JSON feeds
      const url = 'https://www.cisa.gov/api/1/json/alerts';
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.alerts || data || []).map(alert => {
        const normalized = DataNormalizer.normalizeCISA({
          id: alert.id || alert.identifier,
          title: alert.title,
          summary: alert.summary || alert.description,
          description: alert.body || alert.content,
          severity: alert.severity || 'Medium',
          products: alert.products || [],
          released: alert.released || alert.date,
        });
        normalized.timestamp = alert.released || alert.date || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('CISA fetch failed:', err.message);
      // Fallback to RSS parsing
      return this._fetchCISARSS();
    }
  }

  async _fetchCISARSS() {
    try {
      const url = 'https://www.cisa.gov/news.xml';
      const response = await this.client.get(url);
      const xml = response.data;

      const items = [];
      const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

      for (const block of itemBlocks) {
        const extract = (tag) => {
          const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>(.*?)<\\/${tag}>`, 's'));
          if (m) return m[1].replace(/<\/?[^>]+>/g, '').trim();
          const selfClose = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?\\s*/>`, 's'));
          return selfClose ? '' : null;
        };

        const title = extract('title');
        const link = extract('link');
        const pubDate = extract('pubDate');
        const description = extract('description');

        if (!title || !link) continue;

        items.push({
          externalId: `cisa-rss-${Buffer.from(link).toString('base64').slice(0, 15)}`,
          title,
          excerpt: (description || '').slice(0, 300),
          source: 'CISA',
          sourceReliability: 99,
          eventType: 'cyber',
          confidence: 90,
          region: 'United States',
          coordinates: [38.9072, -77.0369],
          tags: ['CISA', 'Cyber', 'Alert'],
          timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          url: link,
        });
      }

      return items;
    } catch (err) {
      console.error('CISA RSS fallback failed:', err.message);
      return [];
    }
  }

  /**
   * MISP (Malware Information Sharing Platform) API
   * Requires MISP instance URL and API key
   */
  async fetchMISPEvents(days = 7, limit = 50) {
    if (!this.mispUrl || !this.mispKey) {
      console.warn('MISP URL or API key not configured. Skipping MISP ingestion.');
      return [];
    }

    try {
      const url = `${this.mispUrl}/events/index`;
      const response = await this.client.post(url, {
        returnFormat: 'json',
        limit: limit,
        published: true,
        timestamp: Math.floor(Date.now() / 1000) - (days * 86400),
      }, {
        headers: {
          'Authorization': this.mispKey,
          'Accept': 'application/json',
        },
      });
      const data = JSON.parse(response.data);

      return (data || []).map(event => {
        const normalized = DataNormalizer.normalizeMISP({ Event: event });
        normalized.timestamp = event.date || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('MISP fetch failed:', err.message);
      return [];
    }
  }

  /**
   * AlienVault OTX (Open Threat Exchange) - Free API
   */
  async fetchOTXPulses(limit = 20) {
    if (!this.otxKey) {
      console.warn('AlienVault OTX key not configured. Skipping OTX ingestion.');
      return [];
    }

    try {
      const url = `https://otx.alienvault.com/api/v1/pulses/subscribed?limit=${limit}`;
      const response = await this.client.get(url, {
        headers: { 'X-OTX-API-KEY': this.otxKey },
      });
      const data = JSON.parse(response.data);

      return (data.results || []).map(pulse => ({
        externalId: `otx-${pulse.id}`,
        title: `OTX: ${pulse.name}`,
        excerpt: pulse.description?.slice(0, 300) || 'Threat intelligence pulse',
        source: 'AlienVault OTX',
        sourceReliability: 85,
        eventType: 'cyber',
        confidence: 80,
        region: null,
        coordinates: null,
        tags: ['OTX', 'ThreatIntel', ...(pulse.tags || [])].filter(Boolean),
        timestamp: pulse.created || new Date().toISOString(),
        url: `https://otx.alienvault.com/pulse/${pulse.id}`,
      }));
    } catch (err) {
      console.error('OTX fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Abuse.ch URLhaus (free, no key)
   * https://urlhaus-api.abuse.ch/
   */
  async fetchURLhausRecent(limit = 50) {
    try {
      const url = 'https://urlhaus-api.abuse.ch/v1/urls/recent/';
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.urls || []).slice(0, limit).map(entry => ({
        externalId: `urlhaus-${entry.id}`,
        title: `URLhaus: Malicious URL Detected`,
        excerpt: `Threat: ${entry.threat}. Host: ${entry.url}. Tags: ${entry.tags?.join(', ') || 'N/A'}`,
        source: 'Abuse.ch URLhaus',
        sourceReliability: 95,
        eventType: 'cyber',
        confidence: 92,
        region: null,
        coordinates: null,
        tags: ['URLhaus', 'Malware', 'Phishing', ...(entry.tags || [])].filter(Boolean),
        timestamp: entry.date_added || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('URLhaus fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Aggregate all cyber sources
   */
  async fetchAll() {
    const results = await Promise.allSettled([
      this.fetchCISAAlerts(),
      this.fetchMISPEvents(),
      this.fetchOTXPulses(),
      this.fetchURLhausRecent(),
    ]);

    const events = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        events.push(...result.value);
      }
    });

    return events;
  }
}

module.exports = { CyberIntelService };
