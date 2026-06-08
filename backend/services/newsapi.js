/**
 * News API Aggregation Service
 * Supports: NewsAPI.org, Reuters API, AP API, AFP feeds
 * Requires API keys for production use.
 */
const { HttpClient } = require('../utils/httpClient');
const { DataNormalizer } = require('../utils/normalizer');

class NewsAPIService {
  constructor() {
    this.newsApiKey = process.env.NEWSAPI_KEY;
    this.reutersKey = process.env.REUTERS_API_KEY;
    this.apKey = process.env.AP_API_KEY;

    this.client = new HttpClient({ rateLimitMs: 1000 });

    this.endpoints = {
      newsapi: 'https://newsapi.org/v2/everything',
      reuters: 'https://api.reuters.com/v1/news',
      ap: 'https://api.ap.org/v2/news',
    };
  }

  /**
   * Fetch geopolitical news from NewsAPI.org (free tier: 100 req/day)
   */
  async fetchNewsAPI(query = 'geopolitics OR conflict OR sanctions OR diplomacy', pageSize = 20) {
    if (!this.newsApiKey) {
      console.warn('NewsAPI key not configured. Skipping NewsAPI ingestion.');
      return [];
    }

    try {
      const fromDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const params = new URLSearchParams({
        q: query,
        from: fromDate,
        sortBy: 'relevancy',
        language: 'en',
        pageSize: pageSize.toString(),
        apiKey: this.newsApiKey,
      });

      const url = `${this.endpoints.newsapi}?${params.toString()}`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.articles || []).map(article => {
        const normalized = DataNormalizer.normalizeNewsAPI(article, article.source?.name);
        normalized.timestamp = article.publishedAt || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('NewsAPI fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Fetch top headlines for quick alerts
   */
  async fetchHeadlines(country = 'us', category = 'general') {
    if (!this.newsApiKey) return [];

    try {
      const params = new URLSearchParams({
        country,
        category,
        apiKey: this.newsApiKey,
      });
      const url = `https://newsapi.org/v2/top-headlines?${params.toString()}`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.articles || []).map(article => {
        const normalized = DataNormalizer.normalizeNewsAPI(article, article.source?.name);
        normalized.timestamp = article.publishedAt || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('Headlines fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Reuters API (requires partnership/API key)
   */
  async fetchReuters(query = 'geopolitics', limit = 20) {
    if (!this.reutersKey) {
      console.warn('Reuters API key not configured. Skipping Reuters ingestion.');
      return [];
    }

    try {
      const url = `${this.endpoints.reuters}?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await this.client.get(url, {
        headers: { 'Authorization': `Bearer ${this.reutersKey}` },
      });
      const data = JSON.parse(response.data);

      return (data.newsItems || []).map(item => {
        const normalized = DataNormalizer.normalizeNewsAPI(item, 'Reuters');
        normalized.timestamp = item.publishedDate || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('Reuters fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Associated Press API
   */
  async fetchAP(query = 'international', limit = 20) {
    if (!this.apKey) {
      console.warn('AP API key not configured. Skipping AP ingestion.');
      return [];
    }

    try {
      const url = `${this.endpoints.ap}?q=${encodeURIComponent(query)}&apikey=${this.apKey}&limit=${limit}`;
      const response = await this.client.get(url);
      const data = JSON.parse(response.data);

      return (data.entries || []).map(item => {
        const normalized = DataNormalizer.normalizeNewsAPI(item, 'AP');
        normalized.timestamp = item.published || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('AP fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Aggregate all configured news sources
   */
  async fetchAll() {
    const results = await Promise.allSettled([
      this.fetchNewsAPI(),
      this.fetchReuters(),
      this.fetchAP(),
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

module.exports = { NewsAPIService };
