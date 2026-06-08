/**
 * GDELT 2.0 Global Database of Events, Language, and Tone
 * Free, no API key required. Uses CSV/TSV downloads.
 * Docs: https://www.gdeltproject.org/data.html
 */
const { HttpClient } = require('../utils/httpClient');
const { DataNormalizer } = require('../utils/normalizer');

class GDELTService {
  constructor() {
    this.client = new HttpClient({
      rateLimitMs: 5000, // GDELT is generous but be polite
      userAgent: 'ORION-SENTINEL-OSINT/1.0 (Research)',
    });
    this.baseUrl = 'https://api.gdeltproject.org/api/v2';
  }

  /**
   * Fetch last 15 minutes of events (GDELT updates every 15 min)
   */
  async fetchLatestEvents() {
    try {
      return await this.fetchNewsArticles('conflict OR protest OR military OR sanction OR cyber', 10);
    } catch (err) {
      console.error('GDELT fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch events by date range using GDELT Event Database
   */
  async fetchByDateRange(startDate, endDate) {
    try {
      const format = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
      const url = `http://data.gdeltproject.org/events/${format(startDate)}-${format(endDate)}.export.CSV.zip`;
      // In production, download and parse the CSV
      // For now, return mock-normalized data structure
      return [];
    } catch (err) {
      console.error('GDELT range fetch failed:', err.message);
      return [];
    }
  }

  _parseGeoJSON(geojson) {
    if (!geojson || !geojson.features) return [];

    return geojson.features.map(feature => {
      const props = feature.properties;
      const coords = feature.geometry?.coordinates;

      const normalized = DataNormalizer.normalizeGDELT({
        GLOBALEVENTID: props.id || Math.random().toString(36),
        SOURCEURL: props.url,
        Actor1Name: props.actor1,
        Actor2Name: props.actor2,
        EventCode: props.eventcode,
        Actor1Geo_Lat: coords?.[1],
        Actor1Geo_Long: coords?.[0],
        Actor1Geo_FullName: props.name,
        NumMentions: props.mentioncount || 1,
      });

      normalized.timestamp = new Date().toISOString();
      return normalized;
    }).filter(e => e.coordinates);
  }

  /**
   * Alternative: Use GDELT DOC API for news articles
   */
  async fetchNewsArticles(query, maxResults = 50) {
    try {
      const url = `${this.baseUrl}/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=${maxResults}&format=json`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.articles || []).map(article => ({
        externalId: `gdelt-doc-${Buffer.from(article.url).toString('base64').slice(0, 20)}`,
        title: article.title,
        excerpt: article.seentime ? `Published: ${article.seentime}` : '',
        source: article.domain || 'GDELT',
        sourceReliability: 80,
        eventType: 'diplomatic',
        confidence: 65,
        region: null,
        coordinates: null,
        tags: ['GDELT', 'News'],
        url: article.url,
        timestamp: article.seentime || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('GDELT doc fetch failed:', err.message);
      return [];
    }
  }
}

module.exports = { GDELTService };
