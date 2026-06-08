class HttpClient {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000;
    this.retries = options.retries || 2;
    this.retryDelay = options.retryDelay || 1000;
    this.rateLimitMs = options.rateLimitMs || 1000;
    this.lastRequestTime = 0;
  }

  async _rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise(r => setTimeout(r, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async request(url, options = {}) {
    await this._rateLimit();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchOpts = {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'ORION-SENTINEL-OSINT/1.0',
          'Accept': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      };
      if (options.body) fetchOpts.body = options.body;

      const res = await fetch(url, fetchOpts);
      const data = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${data.slice(0, 200)}`);
      }
      return { status: res.status, data, headers: Object.fromEntries(res.headers) };
    } finally {
      clearTimeout(timer);
    }
  }

  async get(url, options = {}) {
    let lastError;
    for (let i = 0; i < this.retries; i++) {
      try {
        return await this.request(url, { ...options, method: 'GET' });
      } catch (err) {
        lastError = err;
        if (i < this.retries - 1) {
          await new Promise(r => setTimeout(r, this.retryDelay * (i + 1)));
        }
      }
    }
    throw lastError;
  }

  async post(url, body, options = {}) {
    const isJson = typeof body === 'object' && !(body instanceof String);
    return this.request(url, {
      ...options,
      method: 'POST',
      body: isJson ? JSON.stringify(body) : body,
      headers: {
        'Content-Type': isJson ? 'application/json' : 'application/x-www-form-urlencoded',
        ...options.headers,
      },
    });
  }
}

module.exports = { HttpClient };
