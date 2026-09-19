const pino = require("pino");
const { env } = require("./env");

const logger = pino({
  level: env.logLevel,
  base: undefined,
  redact: ["req.headers.authorization", "req.headers.cookie"],
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

module.exports = { logger };
