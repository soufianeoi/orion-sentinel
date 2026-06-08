/**
 * Lightweight NLP pipeline for entity extraction, geocoding, and sentiment
 * In production, replace with spaCy, transformers, or cloud NLP APIs
 */
class NLPEngine {
  constructor() {
    this.locationCache = new Map();
    this.countries = [
      'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan',
      'Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Bosnia','Botswana','Brazil','Bulgaria','Burkina','Burundi',
      'Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Congo','Croatia','Cuba','Cyprus','Czech',
      'Denmark','Dominican Republic','Ecuador','Egypt','El Salvador','Eritrea','Estonia','Ethiopia',
      'Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Guyana',
      'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
      'Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Liberia','Libya','Lithuania','Luxembourg',
      'Madagascar','Malawi','Malaysia','Mali','Malta','Mauritania','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
      'Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','Norway',
      'Oman','Pakistan','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
      'Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Sierra Leone','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
      'Taiwan','Tajikistan','Tanzania','Thailand','Togo','Trinidad','Tunisia','Turkey','Turkmenistan',
      'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
      'Vatican','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
      'Jerusalem','Gaza','Tel Aviv','Baghdad','Kabul','Damascus','Tehran','Riyadh','Beijing','Moscow','Kyiv',
      'London','Paris','Berlin','Washington','Minsk','Prague','Warsaw','Belgrade','Sarajevo','Tirana',
      'Bangkok','Hanoi','Jakarta','Manila','Seoul','Tokyo','New Delhi','Islamabad','Cairo','Algiers','Tripoli','Khartoum','Addis Ababa','Nairobi','Abuja','Pretoria','Cape Town','Lagos','Kinshasa','Luanda','Maputo','Harare',
    ];
    this.conflictKeywords = ['attack', 'strike', 'bomb', 'clash', 'fire', 'shell', 'raid', 'assault', 'invasion', 'war', 'battle', 'kill', 'death', 'casualty'];
    this.economicKeywords = ['sanction', 'trade', 'tariff', 'market', 'stock', 'currency', 'inflation', 'gdp', 'export', 'import', 'investment'];
    this.diplomaticKeywords = ['summit', 'treaty', 'agreement', 'negotiation', 'talks', 'delegation', 'embassy', 'diplomat', 'resolution'];
    this.cyberKeywords = ['hack', 'breach', 'ransomware', 'phishing', 'ddos', 'malware', 'exploit', 'vulnerability', 'cyber', 'apt'];
    this.environmentalKeywords = ['drought', 'flood', 'hurricane', 'earthquake', 'wildfire', 'climate', 'tsunami', 'storm', 'heatwave'];
  }

  classifyEventType(text) {
    const lower = (text || '').toLowerCase();
    const scores = {
      conflict: this._scoreKeywords(lower, this.conflictKeywords),
      economic: this._scoreKeywords(lower, this.economicKeywords),
      diplomatic: this._scoreKeywords(lower, this.diplomaticKeywords),
      cyber: this._scoreKeywords(lower, this.cyberKeywords),
      environmental: this._scoreKeywords(lower, this.environmentalKeywords),
    };
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : 'diplomatic';
  }

  extractEntities(text) {
    const entities = { persons: [], organizations: [], locations: [], dates: [] };
    const lower = text.toLowerCase();
    const foundLocations = this.countries.filter(c => lower.includes(c.toLowerCase()));
    entities.locations = [...new Set(foundLocations)].slice(0, 3);
    const capitalized = text.match(/[A-Z][a-zA-Z\s]+(?:[A-Z][a-zA-Z]+){0,2}/g) || [];
    entities.organizations = [...new Set(capitalized.filter(w => w.length > 3).slice(0, 5))];
    const datePatterns = [
      /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
      /\b\d{4}-\d{2}-\d{2}\b/g,
    ];
    datePatterns.forEach(p => {
      const matches = text.match(p);
      if (matches) entities.dates.push(...matches);
    });
    return entities;
  }

  async geocodeLocation(locationName) {
    if (!locationName) return null;
    if (this.locationCache.has(locationName)) return this.locationCache.get(locationName);
    try {
      const { HttpClient } = require('../utils/httpClient');
      const client = new HttpClient({ rateLimitMs: 1100 });
      const encoded = encodeURIComponent(locationName);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
      const response = await client.get(url);
      const data = JSON.parse(response.data);
      if (data && data.length > 0) {
        const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
        this.locationCache.set(locationName, result);
        return result;
      }
    } catch (err) {
      console.warn(`Geocoding failed for "${locationName}":`, err.message);
    }
    return null;
  }

  calculateConfidence(event) {
    let score = 50;
    score += (event.sourceReliability || 50) * 0.3;
    if (event.coordinates) score += 10;
    if (event.content && event.content.length > 200) score += 10;
    if (event.tags && event.tags.length > 2) score += 5;
    const age = Date.now() - new Date(event.timestamp).getTime();
    if (age < 3600000) score += 10;
    else if (age < 86400000) score += 5;
    return Math.min(Math.round(score), 98);
  }

  sentimentScore(text) {
    const positive = ['peace', 'agreement', 'cooperation', 'growth', 'success', 'stable', 'improve'];
    const negative = ['attack', 'crisis', 'death', 'collapse', 'war', 'sanction', 'threat', 'violence'];
    const lower = (text || '').toLowerCase();
    let pos = positive.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
    let neg = negative.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
    if (pos + neg === 0) return 0;
    return (neg - pos) / (pos + neg);
  }

  _scoreKeywords(text, keywords) {
    return keywords.reduce((score, kw) => score + (text.includes(kw) ? 1 : 0), 0);
  }
}

module.exports = { NLPEngine };
