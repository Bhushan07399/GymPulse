const { env } = require('../config/env');

const errorHandler = (error, request, response, _next) => {
  const statusCode = error.statusCode ?? 500;
  const isOperational = error.isOperational === true;

  request.log?.error({ err: error }, 'Request failed');

  response.status(statusCode).json({
    error: {
      message: isOperational ? error.message : 'Internal server error.',
      ...(error.details ? { details: error.details } : {}),
      ...(env.nodeEnv !== 'production' && !isOperational ? { stack: error.stack } : {})
    }
  });
};

module.exports = { errorHandler };
