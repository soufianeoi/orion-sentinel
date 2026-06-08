/**
 * Social Media Signal Detection
 * Twitter/X API: Requires developer account (expensive tiers now)
 * Alternative: Nitter (unofficial, free), Mastodon, Reddit API
 * Docs: https://developer.twitter.com/en/docs/twitter-api
 */
const { HttpClient } = require('../utils/httpClient');
const { DataNormalizer } = require('../utils/normalizer');

class SocialMediaService {
  constructor() {
    this.twitterBearer = process.env.TWITTER_BEARER_TOKEN;
    this.twitterApiKey = process.env.TWITTER_API_KEY;
    this.twitterApiSecret = process.env.TWITTER_API_SECRET;
    this.redditClientId = process.env.REDDIT_CLIENT_ID;
    this.redditSecret = process.env.REDDIT_SECRET;

    this.client = new HttpClient({ rateLimitMs: 2000 });
  }

  /**
   * Twitter/X API v2 - Recent search (Academic/Enterprise tiers)
   * Free tier: 100 requests/month, 25 tweets/request
   */
  async searchTwitter(query = 'geopolitics -is:retweet lang:en', maxResults = 25) {
    if (!this.twitterBearer) {
      console.warn('Twitter Bearer token not configured. Skipping Twitter ingestion.');
      return [];
    }

    try {
      const params = new URLSearchParams({
        query,
        max_results: maxResults.toString(),
        'tweet.fields': 'created_at,geo,public_metrics,context_annotations,entities',
        'expansions': 'geo.place_id',
        'place.fields': 'full_name,geo,country',
      });

      const url = `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`;
      const response = await this.client.get(url, {
        headers: { 'Authorization': `Bearer ${this.twitterBearer}` },
      });
      const data = JSON.parse(response.data);

      return (data.data || []).map(tweet => {
        const place = data.includes?.places?.find(p => p.id === tweet.geo?.place_id);
        const normalized = DataNormalizer.normalizeTwitter({
          id: tweet.id,
          text: tweet.text,
          geo: tweet.geo,
          place: place,
          entities: tweet.entities,
          public_metrics: tweet.public_metrics,
        });
        normalized.timestamp = tweet.created_at || new Date().toISOString();
        return normalized;
      });
    } catch (err) {
      console.error('Twitter search failed:', err.message);
      return [];
    }
  }

  /**
   * Reddit API (free, requires OAuth)
   * Good for ground-truth signals and crowd-sourced intel
   */
  async searchReddit(subreddits = ['worldnews', 'geopolitics', 'conflict', 'cybersecurity'], limit = 25) {
    if (!this.redditClientId || !this.redditSecret) {
      console.warn('Reddit credentials not configured. Skipping Reddit ingestion.');
      return [];
    }

    try {
      // First get OAuth token
      const auth = Buffer.from(`${this.redditClientId}:${this.redditSecret}`).toString('base64');
      const tokenRes = await this.client.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      const tokenData = JSON.parse(tokenRes.data);
      const accessToken = tokenData.access_token;

      const results = [];
      for (const sub of subreddits) {
        const url = `https://oauth.reddit.com/r/${sub}/new?limit=${limit}`;
        const res = await this.client.get(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const data = JSON.parse(res.data);

        const posts = (data.data?.children || []).map(post => ({
          externalId: `reddit-${post.data.id}`,
          title: post.data.title,
          excerpt: post.data.selftext?.slice(0, 300) || '',
          content: post.data.selftext || null,
          source: `Reddit/r/${sub}`,
          sourceReliability: 35, // Crowd-sourced = lower reliability
          eventType: 'diplomatic',
          confidence: 30,
          region: null,
          coordinates: null,
          tags: ['Reddit', 'Social', sub, ...(post.data.link_flair_text ? [post.data.link_flair_text] : [])],
          timestamp: new Date(post.data.created_utc * 1000).toISOString(),
          url: `https://reddit.com${post.data.permalink}`,
        }));

        results.push(...posts);
      }

      return results;
    } catch (err) {
      console.error('Reddit fetch failed:', err.message);
      return [];
    }
  }

  /**
   * Aggregate all social sources
   */
  async fetchAll() {
    const results = await Promise.allSettled([
      this.searchTwitter(),
      this.searchReddit(),
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

module.exports = { SocialMediaService };
