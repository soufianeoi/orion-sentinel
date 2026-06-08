# Data Source Configuration Guide

## 1. GDELT (Global Database of Events, Language, and Tone)

**Cost:** FREE (no API key required)
**Rate Limit:** Be polite, ~1 request per 5 seconds
**Update Frequency:** Every 15 minutes

**Setup:**
- No configuration needed for basic access
- For GKG API access, just use the endpoints directly
- For bulk CSV downloads, use their S3 bucket

**Endpoints Used:**
- `https://api.gdeltproject.org/api/v2/geo/geo` — Geospatial events
- `https://api.gdeltproject.org/api/v2/doc/doc` — News articles

**Data Coverage:**
- Global news events from 1979-present
- Real-time monitoring of broadcast, web, and print news
- 100+ languages, translated to English

---

## 2. ACLED (Armed Conflict Location & Event Data)

**Cost:** FREE for academic/research use
**Rate Limit:** Varies by tier
**Update Frequency:** Weekly (real-time for some regions)

**Setup:**
1. Register at: https://acleddata.com/
2. Request API access via email
3. Receive API key and authorized email address
4. Add to `.env`:
```
ACLED_API_KEY=your_key_here
ACLED_EMAIL=your_email@institution.edu
```

**Data Coverage:**
- 150+ countries
- Real-time data for Africa, Middle East, Asia, Europe, Latin America
- 1997-present (varies by region)

---

## 3. Sentinel-2 / Satellite Imagery

**Cost:** FREE (Copernicus) / PAID (Planet)
**Rate Limit:** Varies by provider
**Update Frequency:** 5-day revisit (Sentinel-2), daily (Planet)

### Sentinel-2 (Free)
**Setup:**
1. Register at: https://dataspace.copernicus.eu/
2. No API key needed for search, auth needed for download
3. Add credentials to `.env` (optional):
```
COPERNICUS_USER=your_username
COPERNICUS_PASS=your_password
```

### Planet Labs (Paid)
**Setup:**
1. Sign up at: https://www.planet.com/
2. Get API key from dashboard
3. Add to `.env`:
```
PLANET_API_KEY=your_planet_key
```

---

## 4. MarineTraffic AIS

**Cost:** FREE tier available (limited) / PAID for full access
**Rate Limit:** 1 request per 2 seconds (free)
**Update Frequency:** Near real-time (vessel positions update every 1-10 minutes)

**Setup:**
1. Register at: https://www.marinetraffic.com/en/ais-api-services
2. Choose API plan (PS01 for vessel positions)
3. Add to `.env`:
```
MARINETRAFFIC_API_KEY=your_api_key
```

**Alternative (Free):**
- AISHub: http://www.aishub.net/ (no key required)
- MarineCadastre (US only): https://marinecadastre.gov/ais/

---

## 5. News APIs (Reuters, AP, AFP)

### NewsAPI.org (Free Tier)
**Cost:** 100 requests/day free / $449/month for 1M requests
**Setup:**
1. Register at: https://newsapi.org/register
2. Copy API key
3. Add to `.env`:
```
NEWSAPI_KEY=your_newsapi_key
```

### Reuters API
**Cost:** Requires partnership agreement
**Setup:**
- Contact Reuters directly for API access
- Enterprise pricing

### Associated Press API
**Cost:** Requires subscription
**Setup:**
- Contact AP for API access

---

## 6. Social Media (Twitter/X, Reddit)

### Twitter/X API
**Cost:** $100/month (Basic) / $5,000/month (Pro) / $42,000/month (Enterprise)
**Setup:**
1. Apply at: https://developer.twitter.com/en/portal/dashboard
2. Choose tier (Basic minimum for search)
3. Create app and get tokens
4. Add to `.env`:
```
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
```

**Note:** Twitter API has become very expensive. Consider alternatives:
- Nitter (unofficial, free but unstable)
- Mastodon API (free, federated)
- Bluesky API (free, emerging)

### Reddit API
**Cost:** FREE (with rate limits)
**Setup:**
1. Create app at: https://www.reddit.com/prefs/apps
2. Get Client ID and Secret
3. Add to `.env`:
```
REDDIT_CLIENT_ID=your_client_id
REDDIT_SECRET=your_secret
```

---

## 7. Cyber Threat Intelligence

### CISA (Cybersecurity & Infrastructure Security Agency)
**Cost:** FREE
**Setup:**
- No API key needed
- RSS feeds and JSON API available directly
- Alerts: https://www.cisa.gov/news.xml
- API: https://www.cisa.gov/api/1/json/alerts

### MISP (Malware Information Sharing Platform)
**Cost:** FREE (self-hosted) / Community instances available
**Setup:**
1. Set up MISP instance or join community
2. Generate API key in MISP web UI
3. Add to `.env`:
```
MISP_URL=https://your-misp-instance.com
MISP_API_KEY=your_misp_key
```

### AlienVault OTX (Open Threat Exchange)
**Cost:** FREE
**Setup:**
1. Register at: https://otx.alienvault.com/
2. Get API key from profile settings
3. Add to `.env`:
```
ALIENVAULT_OTX_KEY=your_otx_key
```

### Abuse.ch (URLhaus, MalwareBazaar)
**Cost:** FREE
**Setup:**
- No API key needed
- Direct API access: https://urlhaus-api.abuse.ch/

---

## Quick Start Checklist

To get real data flowing:

1. [ ] Copy `.env.example` to `.env`
2. [ ] Set `USE_REAL_INGESTION=true`
3. [ ] Add at least 3 API keys (recommend: GDELT + NewsAPI + CISA)
4. [ ] Run `docker-compose up -d`
5. [ ] Check `/api/admin/ingestion/stats` for status
6. [ ] Watch events appear in real-time on the dashboard

**Minimum viable setup (FREE):**
- GDELT: No key needed
- CISA: No key needed
- Abuse.ch: No key needed
- Reddit: Free key
- AISHub: No key needed

This gives you 5 active sources with zero cost.
