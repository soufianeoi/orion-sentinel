/**
 * Redis-backed Job Queue for background processing
 * Handles heavy NLP tasks, image analysis, and bulk imports
 */
const redis = require('redis');

class JobQueue {
  constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.client = redis.createClient({ url: redisUrl });
    this.subscriber = redis.createClient({ url: redisUrl });
    this.publisher = redis.createClient({ url: redisUrl });
    this.processors = new Map();
    this.isRunning = false;
  }

  async connect() {
    await this.client.connect();
    await this.subscriber.connect();
    await this.publisher.connect();
    console.log('✅ Redis queue connected');
  }

  async disconnect() {
    await this.client.quit();
    await this.subscriber.quit();
    await this.publisher.quit();
  }

  async enqueue(queueName, job) {
    const jobData = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queue: queueName,
      data: job,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };

    await this.client.lPush(`queue:${queueName}`, JSON.stringify(jobData));
    await this.publisher.publish(`queue:${queueName}:new`, JSON.stringify(jobData));

    return jobData.id;
  }

  async process(queueName, processor) {
    this.processors.set(queueName, processor);

    await this.subscriber.subscribe(`queue:${queueName}:new`, async (message) => {
      if (!this.isRunning) return;

      const job = JSON.parse(message);
      await this._executeJob(queueName, job);
    });

    // Process any existing jobs in queue
    this.isRunning = true;
    this._drainQueue(queueName);
  }

  async _drainQueue(queueName) {
    while (this.isRunning) {
      const jobJson = await this.client.rPop(`queue:${queueName}`);
      if (!jobJson) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const job = JSON.parse(jobJson);
      await this._executeJob(queueName, job);
    }
  }

  async _executeJob(queueName, job) {
    const processor = this.processors.get(queueName);
    if (!processor) return;

    job.status = 'processing';
    job.attempts++;

    try {
      await processor(job.data);
      job.status = 'completed';
      job.completedAt = new Date().toISOString();

      await this.client.lPush(`queue:${queueName}:completed`, JSON.stringify(job));
      await this.publisher.publish(`queue:${queueName}:completed`, JSON.stringify(job));
    } catch (err) {
      console.error(`Job ${job.id} failed:`, err.message);
      job.status = 'failed';
      job.error = err.message;

      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000;
        setTimeout(() => {
          this.client.lPush(`queue:${queueName}`, JSON.stringify(job));
        }, delay);
      } else {
        await this.client.lPush(`queue:${queueName}:dead`, JSON.stringify(job));
      }
    }
  }

  async getQueueStatus(queueName) {
    const pending = await this.client.lLen(`queue:${queueName}`);
    const completed = await this.client.lLen(`queue:${queueName}:completed`);
    const dead = await this.client.lLen(`queue:${queueName}:dead`);

    return { pending, completed, dead };
  }

  stop() {
    this.isRunning = false;
  }
}

module.exports = { JobQueue };
