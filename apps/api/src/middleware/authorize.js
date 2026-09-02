const { logger } = require('../config/logger');
const { AppError } = require('../utils/app-error');

const authorize = (...allowedRoles) => {
  if (allowedRoles.length === 0) {
    throw new Error('At least one allowed role must be provided.');
  }

  const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());

  return (request, _response, next) => {
    if (!request.user) {
      logger.debug({ path: request.originalUrl, allowedRoles }, '[AUTH DEBUG] Authorization failed: No authenticated user context');
      return next(new AppError(401, 'Authentication is required.'));
    }

    const userRole = String(request.user.role || '').toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      logger.debug({
        path: request.originalUrl,
        userId: request.user.id,
        gymId: request.user.gymId,
        userRole: request.user.role,
        allowedRoles,
        authorizationResult: 'REJECTED',
        rejectionReason: `Role '${request.user.role}' is not in allowed roles: [${allowedRoles.join(', ')}]`
      }, '[AUTH DEBUG] Role authorization rejected');

      return next(new AppError(403, 'Forbidden.'));
    }

    logger.debug({
      path: request.originalUrl,
      userId: request.user.id,
      gymId: request.user.gymId,
      userRole: request.user.role,
      allowedRoles,
      authorizationResult: 'GRANTED'
    }, '[AUTH DEBUG] Role authorization granted');

    return next();
  };
};

module.exports = { authorize };
