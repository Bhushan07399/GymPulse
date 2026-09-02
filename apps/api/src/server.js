const { app } = require('./app');
const { assertRuntimeEnvironment, env } = require('./config/env');
const { logger } = require('./config/logger');
const { closePool } = require('./db/pool');
const { ensureSchema } = require('./db/migrate');
const { startNotificationScheduler, stopNotificationScheduler } = require('./services/notification-scheduler.service');

assertRuntimeEnvironment();

const server = app.listen(env.port, async () => {
  logger.info({ port: env.port, environment: env.nodeEnv }, 'API server started');
  await ensureSchema();
  startNotificationScheduler();
});

const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutting down API server');
  stopNotificationScheduler();

  server.close(async () => {
    await closePool();
    logger.info('API server stopped');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
