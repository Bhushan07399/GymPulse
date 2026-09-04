const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const parsePort = (value) => {
  const port = Number.parseInt(value ?? '5000', 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
};

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  jwtSecret: process.env.JWT_SECRET
});

const assertRuntimeEnvironment = () => {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required to start the API.');
  }

  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is required to start the API.');
  }
};

module.exports = { env, assertRuntimeEnvironment };
