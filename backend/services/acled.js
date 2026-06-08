/**
 * ACLED (Armed Conflict Location & Event Data Project)
 * Requires API key for full access. Academic/research use is free.
 * Docs: https://acleddata.com/acleddatanew/wp-content/uploads/dlm_uploads/2020/10/ACLED_API-User-Guide_2020.pdf
 */
const { HttpClient } = require('../utils/httpClient');
const { DataNormalizer } = require('../utils/normalizer');

class ACLEDService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.ACLED_API_KEY;
    this.email = process.env.ACLED_EMAIL; // Required for API access
    this.client = new HttpClient({
      rateLimitMs: 2000,
      userAgent: 'ORION-SENTINEL-OSINT/1.0',
    });
    this.baseUrl = 'https://api.acleddata.com/acled/read';
  }

  /**
   * Fetch recent conflict events
   */
  async fetchRecentEvents(days = 7, limit = 100) {
    if (!this.apiKey || !this.email) {
      console.warn('ACLED API key or email not configured. Skipping ACLED ingestion.');
      return [];
    }

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const params = new URLSearchParams({
        key: this.apiKey,
        email: this.email,
        event_date: `${startDate}|${endDate}`,
        event_date_where: 'BETWEEN',
        fields: 'event_id_cnty,event_date,year,time_precision,event_type,actor1,actor2,country,admin1,admin2,admin3,location,latitude,longitude,geo_precision,source,fatalities,notes,inter1,inter2',
        limit: limit.toString(),
        format: 'json',
      });

      const url = `${this.baseUrl}?${params.toString()}`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.data || []).map(raw => {
        const normalized = DataNormalizer.normalizeACLED(raw);
        normalized.timestamp = raw.event_date || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('ACLED fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch by specific country or region
   */
  async fetchByRegion(region, days = 7, limit = 50) {
    if (!this.apiKey || !this.email) return [];

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const params = new URLSearchParams({
        key: this.apiKey,
        email: this.email,
        region: region,
        event_date: `${startDate}|${endDate}`,
        event_date_where: 'BETWEEN',
        limit: limit.toString(),
        format: 'json',
      });

      const url = `${this.baseUrl}?${params.toString()}`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.data || []).map(raw => DataNormalizer.normalizeACLED(raw));
    } catch (err) {
      console.error('ACLED region fetch failed:', err.message);
      return [];
    }
  }
}

module.exports = { ACLEDService };
