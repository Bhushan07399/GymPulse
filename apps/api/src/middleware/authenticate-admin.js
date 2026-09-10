const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { pool } = require('../db/pool');
const { logger } = require('../config/logger');
const { AppError } = require('../utils/app-error');

const authenticateAdmin = async (request, _response, next) => {
  const authorization = request.get('authorization');
  const [scheme, token] = authorization?.split(/\s+/) ?? [];

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Admin authentication token is required.'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (
      typeof payload !== 'object' ||
      !payload.sub ||
      payload.type !== 'SUPER_ADMIN' ||
      payload.role !== 'SUPER_ADMIN' ||
      Boolean(payload.gymId) // Reject any customer gym tokens
    ) {
      logger.warn(
        { path: request.originalUrl, role: payload.role, type: payload.type },
        '[ADMIN AUTH] Token rejected: Not a valid Super Admin token'
      );
      return next(new AppError(403, 'Forbidden: Super Admin privileges required.'));
    }

    const adminRes = await pool.query(
      `SELECT id, email, name, role, is_active FROM admin_users WHERE id = $1 LIMIT 1`,
      [payload.sub]
    );

    const admin = adminRes.rows[0];
    if (!admin || admin.is_active !== true) {
      return next(new AppError(401, 'Super Admin account is inactive or not found.'));
    }

    request.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    logger.warn({ path: request.originalUrl, error: error.message }, '[ADMIN AUTH] Token verification failed');
    return next(new AppError(401, 'Invalid or expired admin authentication token.'));
  }
};

module.exports = { authenticateAdmin };