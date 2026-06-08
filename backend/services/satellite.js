/**
 * Satellite Imagery & EO Change Detection
 * Sentinel-2: Free via Copernicus Open Access Hub (scihub.copernicus.eu)
 * Planet: Requires API key (planet.com)
 * USGS EarthExplorer: Free Landsat/Sentinel access
 */
const { HttpClient } = require('../utils/httpClient');
const { DataNormalizer } = require('../utils/normalizer');

class SatelliteService {
  constructor() {
    this.planetKey = process.env.PLANET_API_KEY;
    this.copernicusUser = process.env.COPERNICUS_USER;
    this.copernicusPass = process.env.COPERNICUS_PASS;

    this.client = new HttpClient({ rateLimitMs: 3000 });
  }

  /**
   * Search Sentinel-2 products by area of interest
   * Uses OpenSearch API (no auth required for search, auth for download)
   */
  async searchSentinel(bbox, startDate, endDate, maxCloud = 20) {
    try {
      const url = 'https://catalogue.dataspace.copernicus.eu/odata/v1/Products';
      const params = new URLSearchParams({
        '$filter': `Collection/Name eq 'SENTINEL-2' and OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((${bbox}))') and ContentDate/Start gt ${startDate}T00:00:00.000Z and ContentDate/Start lt ${endDate}T23:59:59.999Z and contains(Name,'S2MSI2A') and Online eq true and CloudCover/percentage lt ${maxCloud}`,
        '$orderby': 'ContentDate/Start desc',
        '$top': '10',
        '$skip': '0',
        '$count': 'true',
      });

      const response = await this.client.get(`${url}?${params.toString()}`);
      const data = JSON.parse(response.data);

      return (data.value || []).map(product => ({
        externalId: `sentinel-${product.Id}`,
        title: `Sentinel-2: ${product.Name}`,
        excerpt: `Cloud cover: ${product.CloudCover?.percentage}%. Acquired: ${product.ContentDate?.Start}.`,
        source: 'Sentinel-2',
        sourceReliability: 98,
        eventType: 'environmental',
        confidence: 85,
        region: product.GeographicalExtent?.[0] ? 'Area of Interest' : 'Global',
        coordinates: this._bboxToCenter(bbox),
        tags: ['Sentinel-2', 'EO', 'Satellite', product.Name?.includes('S2MSI2A') ? 'L2A' : 'L1C'],
        timestamp: product.ContentDate?.Start || new Date().toISOString(),
        raw: product,
      }));
    } catch (err) {
      console.error('Sentinel search failed:', err.message);
      return [];
    }
  }

  /**
   * Planet Labs API (requires API key)
   */
  async searchPlanet(bbox, startDate, endDate) {
    if (!this.planetKey) {
      console.warn('Planet API key not configured. Skipping Planet ingestion.');
      return [];
    }

    try {
      const url = 'https://api.planet.com/data/v1/quick-search';
      const body = {
        filter: {
          type: 'AndFilter',
          config: [
            { type: 'DateRangeFilter', field_name: 'acquired', config: { gt: startDate, lt: endDate } },
            { type: 'GeometryFilter', field_name: 'geometry', config: { type: 'Polygon', coordinates: [bbox] } },
          ],
        },
        item_types: ['PSScene'],
      };

      const response = await this.client.post(url, body, {
        headers: { 'Authorization': `api-key ${this.planetKey}` },
      });
      const data = JSON.parse(response.data);

      return (data.features || []).map(feature => {
        const normalized = DataNormalizer.normalizeSentinel({
          id: feature.id,
          title: `Planet: ${feature.properties?.item_type}`,
          location: 'AOI',
          confidence: 90,
          sensor: feature.properties?.item_type,
          lat: feature.geometry?.coordinates?.[1],
          lon: feature.geometry?.coordinates?.[0],
        });
        normalized.timestamp = feature.properties?.acquired || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('Planet search failed:', err.message);
      return [];
    }
  }

  /**
   * Detect changes between two Sentinel images (simplified)
   * In production, use Python with rasterio, numpy, and scikit-image
   */
  async detectChange(image1Id, image2Id) {
    // This would call a Python microservice or use a cloud function
    // For now, return a placeholder structure
    return {
      changeDetected: true,
      confidence: 0.0,
      changeType: 'unknown',
      bbox: null,
    };
  }

  _bboxToCenter(bboxStr) {
    // Parse "minLon,minLat,maxLon,maxLat" format
    const coords = bboxStr.split(',').map(Number);
    if (coords.length === 4) {
      return [(coords[1] + coords[3]) / 2, (coords[0] + coords[2]) / 2];
    }
    return null;
  }
}

module.exports = { SatelliteService };
