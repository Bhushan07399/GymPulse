const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { logger } = require('../config/logger');
const { AppError } = require('../utils/app-error');

const authenticate = (request, _response, next) => {
  const authorization = request.get('authorization');
  const [scheme, token] = authorization?.split(/\s+/) ?? [];

  if (scheme !== 'Bearer' || !token) {
    logger.debug({ path: request.originalUrl, tokenPresent: false }, '[AUTH DEBUG] Token missing or invalid scheme');
    return next(new AppError(401, 'Authentication token is required.'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (
      typeof payload !== 'object' ||
      !payload.sub ||
      typeof payload.gymId !== 'string'
    ) {
      logger.debug({ path: request.originalUrl, tokenPresent: true, tokenValid: false }, '[AUTH DEBUG] JWT payload invalid');
      throw new Error('JWT payload is invalid.');
    }

    request.user = {
      id: payload.sub,
      gymId: payload.gymId,
      role: payload.role
    };

    logger.debug({
      path: request.originalUrl,
      userId: payload.sub,
      gymId: payload.gymId,
      role: payload.role,
      tokenPresent: true,
      tokenValid: true
    }, '[AUTH DEBUG] Authentication successful');

    return next();
  } catch (error) {
    logger.debug({ path: request.originalUrl, error: error.message }, '[AUTH DEBUG] Token verification failed');
    return next(new AppError(401, 'Invalid or expired authentication token.'));
  }
};

module.exports = { authenticate };
