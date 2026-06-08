/**
 * Scheduled tasks for maintenance and data cleanup
 */
const cron = require('node-cron');
const { logger } = require('./logger');

class CronManager {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.tasks = [];
  }

  start() {
    // Daily cleanup of old events (keep 30 days)
    this.tasks.push(cron.schedule('0 2 * * *', () => {
      logger.info('Running daily cleanup task');
      this._cleanupOldEvents();
    }));

    // Hourly health check
    this.tasks.push(cron.schedule('0 * * * *', () => {
      logger.info('Running hourly health check');
      this._healthCheck();
    }));

    // Every 6 hours: rebuild timeline correlations
    this.tasks.push(cron.schedule('0 */6 * * *', () => {
      logger.info('Rebuilding timeline correlations');
      this._rebuildTimeline();
    }));

    logger.info('Cron manager started with', this.tasks.length, 'scheduled tasks');
  }

  stop() {
    this.tasks.forEach(task => task.stop());
    logger.info('Cron manager stopped');
  }

  _cleanupOldEvents() {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [id, event] of this.orchestrator.eventStore) {
      if (new Date(event.timestamp).getTime() < cutoff) {
        this.orchestrator.eventStore.delete(id);
        removed++;
      }
    }

    logger.info(`Cleaned up ${removed} old events`);
  }

  _healthCheck() {
    const stats = this.orchestrator.getStats();
    logger.info('Health check', stats);

    if (stats.errors > 100) {
      logger.error('High error count detected:', stats.errors);
    }
  }

  _rebuildTimeline() {
    // In production, this would recompute correlation matrices
    // and update timeline nodes based on new events
    logger.info('Timeline correlation rebuild completed');
  }
}

module.exports = { CronManager };
