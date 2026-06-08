/**
 * MarineTraffic AIS (Automatic Identification System) Service
 * Requires API key. Free tier limited.
 * Alternative: AISHub (free), MarineCadastre (US only, free)
 * Docs: https://www.marinetraffic.com/en/ais-api-services
 */
const { HttpClient } = require('../utils/httpClient');
const { DataNormalizer } = require('../utils/normalizer');

class MarineTrafficService {
  constructor() {
    this.apiKey = process.env.MARINETRAFFIC_API_KEY;
    this.client = new HttpClient({ rateLimitMs: 2000 });
    this.baseUrl = 'https://services.marinetraffic.com/api';
  }

  /**
   * Fetch vessel positions in a port or area
   */
  async fetchVesselPositions(portId, limit = 50) {
    if (!this.apiKey) {
      console.warn('MarineTraffic API key not configured. Skipping AIS ingestion.');
      return [];
    }

    try {
      const params = new URLSearchParams({
        protocol: 'jsono',
        portid: portId.toString(),
        timespan: '60', // last 60 minutes
        limit: limit.toString(),
        apikey: this.apiKey,
      });

      const url = `${this.baseUrl}/portcalls/${portId}?${params.toString()}`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data || []).map(vessel => {
        const normalized = DataNormalizer.normalizeAIS({
          mmsi: vessel.MMSI,
          shipname: vessel.SHIPNAME,
          shiptype: vessel.SHIPTYPE,
          speed: vessel.SPEED,
          course: vessel.COURSE,
          lat: vessel.LAT,
          lon: vessel.LON,
          port: vessel.PORT_NAME,
          flag: vessel.FLAG,
          status: vessel.STATUS_NAME,
        });
        normalized.timestamp = vessel.ETA || vessel.TIMESTAMP || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('MarineTraffic fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch vessel positions by area (bounding box)
   */
  async fetchAreaPositions(minLat, maxLat, minLon, maxLon, limit = 50) {
    if (!this.apiKey) return [];

    try {
      const params = new URLSearchParams({
        protocol: 'jsono',
        minlat: minLat.toString(),
        maxlat: maxLat.toString(),
        minlon: minLon.toString(),
        maxlon: maxLon.toString(),
        timespan: '60',
        limit: limit.toString(),
        apikey: this.apiKey,
      });

      const url = `${this.baseUrl}/exportvesseltrack/${this.apiKey}?${params.toString()}`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data || []).map(vessel => {
        const normalized = DataNormalizer.normalizeAIS({
          mmsi: vessel.MMSI,
          shipname: vessel.SHIPNAME,
          shiptype: vessel.SHIPTYPE,
          speed: vessel.SPEED,
          course: vessel.COURSE,
          lat: vessel.LAT,
          lon: vessel.LON,
          flag: vessel.FLAG,
          status: vessel.STATUS,
        });
        normalized.timestamp = vessel.TIMESTAMP || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('MarineTraffic area fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Alternative: Use AISHub (free, no key required for basic access)
   * http://www.aishub.net/ais-dispatcher
   */
  async fetchAISHub(limit = 50) {
    try {
      const url = `http://data.aishub.net/ws.php?username=ORION_DEMO&format=1&output=json&compress=0&latmin=20&latmax=60&lonmin=-20&lonmax=40`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data || []).slice(0, limit).map(vessel => {
        const normalized = DataNormalizer.normalizeAIS({
          mmsi: vessel.MMSI,
          shipname: vessel.NAME,
          shiptype: vessel.TYPE,
          speed: vessel.SOG,
          course: vessel.COG,
          lat: vessel.LATITUDE,
          lon: vessel.LONGITUDE,
          flag: vessel.COUNTRY,
          status: vessel.STATUS,
        });
        normalized.timestamp = new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('AISHub fetch failed:', err.message);
      return [];
    }
  }
}

module.exports = { MarineTrafficService };
