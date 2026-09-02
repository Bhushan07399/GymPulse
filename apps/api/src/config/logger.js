const pino = require('pino');
const { env } = require('./env');

const logger = pino({
  level: env.logLevel,
  base: undefined,
  redact: ['req.headers.authorization', 'req.headers.cookie']
});

module.exports = { logger };
