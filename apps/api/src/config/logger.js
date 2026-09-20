const pino = require("pino");
const { env } = require("./env");

let transport;
try {
  require.resolve("pino-pretty");
  if (env.nodeEnv !== "production") {
    transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    };
  }
} catch {
  // pino-pretty not installed, fall back to high-performance JSON logging
}

const logger = pino({
  level: env.logLevel,
  base: undefined,
  redact: ["req.headers.authorization", "req.headers.cookie"],
  ...(transport ? { transport } : {}),
});

module.exports = { logger };
