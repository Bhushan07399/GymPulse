const { Pool } = require('pg');
const { env } = require('../config/env');
const { logger } = require('../config/logger');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : false
});

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected PostgreSQL pool error');
});

const closePool = () => pool.end();

module.exports = { pool, closePool };
