/**
 * Input validation schemas using JSON Schema
 * Prevents injection and ensures data integrity
 */
const eventSchema = {
  type: 'object',
  required: ['title', 'source', 'timestamp'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 500 },
    excerpt: { type: 'string', maxLength: 2000 },
    content: { type: 'string', maxLength: 50000 },
    source: { type: 'string', minLength: 1, maxLength: 100 },
    sourceReliability: { type: 'integer', minimum: 0, maximum: 100 },
    eventType: { type: 'string', enum: ['conflict', 'economic', 'diplomatic', 'cyber', 'environmental'] },
    confidence: { type: 'integer', minimum: 0, maximum: 100 },
    region: { type: 'string', maxLength: 100 },
    coordinates: {
      type: 'array',
      items: { type: 'number' },
      minItems: 2,
      maxItems: 2,
    },
    tags: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 20,
    },
    timestamp: { type: 'string', format: 'date-time' },
  },
};

function validateEvent(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.length > 500) {
    errors.push('Invalid title');
  }
  if (!data.source || typeof data.source !== 'string') {
    errors.push('Invalid source');
  }
  if (data.coordinates && (!Array.isArray(data.coordinates) || data.coordinates.length !== 2)) {
    errors.push('Invalid coordinates');
  }
  if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 100)) {
    errors.push('Confidence must be 0-100');
  }
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  // Sanitize strings to prevent XSS
  if (data.title) data.title = sanitizeString(data.title);
  if (data.excerpt) data.excerpt = sanitizeString(data.excerpt);
  if (data.content) data.content = sanitizeString(data.content);

  return { valid: errors.length === 0, errors };
}

function sanitizeString(str) {
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function sanitizeQueryParams(params) {
  const sanitized = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[<>'"]/g, '').trim();
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = { validateEvent, sanitizeQueryParams, eventSchema };
