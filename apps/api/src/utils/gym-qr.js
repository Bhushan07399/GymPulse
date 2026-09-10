const crypto = require('crypto');
const { env } = require('../config/env');

const QR_PREFIX = 'GYMPULSE-GYM:';

/**
 * Computes a cryptographically secure HMAC-SHA256 signature for a gym ID
 * using the server's private JWT_SECRET.
 * Base64url encoding produces a compact, URL/QR-safe 43-character digest.
 *
 * @param {string} gymId - The canonical UUID of the gym
 * @returns {string} Base64url HMAC digest
 */
const computeGymQrSignature = (gymId) => {
  if (!gymId || typeof gymId !== 'string') {
    throw new Error('Valid gymId is required to compute QR signature');
  }
  return crypto
    .createHmac('sha256', env.jwtSecret)
    .update(`GYMPULSE_PHYSICAL_GYM_QR_V1:${gymId.toLowerCase()}`)
    .digest('base64url');
};

/**
 * Generates the hardened physical Gym QR string to be rendered at reception desk.
 * Format: GYMPULSE-GYM:<gymId>.<signature>
 *
 * @param {string} gymId - Gym UUID
 * @returns {string} Hardened physical QR string
 */
const createGymQrString = (gymId) => {
  const sig = computeGymQrSignature(gymId);
  return `${QR_PREFIX}${gymId}.${sig}`;
};

/**
 * Verifies a Gym QR payload and returns the authenticated gymId.
 * Validates cryptographic signature using constant-time comparison.
 *
 * Rejection criteria:
 * - Empty or non-string input
 * - Malformed UUID
 * - Missing or altered signature
 * - Signature mismatch (timing-safe check)
 *
 * @param {string|object} rawPayload - Scanned QR text or parsed JSON
 * @param {object} [options]
 * @param {boolean} [options.allowUnsigned=false] - Fallback for legacy unsigned QRs if explicitly enabled
 * @returns {string|null} The verified gymId, or null if invalid/tampered
 */
const verifyAndExtractGymId = (rawPayload, { allowUnsigned = false } = {}) => {
  if (!rawPayload) {
    return null;
  }

  let token = typeof rawPayload === 'string' ? rawPayload.trim() : '';

  // Handle JSON wrapped payloads
  if (typeof rawPayload === 'object' && rawPayload !== null) {
    token = rawPayload.token || rawPayload.gymQrString || rawPayload.qr || '';
    if (!token && rawPayload.gymId && rawPayload.sig) {
      token = `${rawPayload.gymId}.${rawPayload.sig}`;
    } else if (!token && rawPayload.gymId && allowUnsigned) {
      token = rawPayload.gymId;
    }
  } else if (token.startsWith('{')) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.token) {
        token = parsed.token;
      } else if (parsed.gymQrString) {
        token = parsed.gymQrString;
      } else if (parsed.gymId && parsed.sig) {
        token = `${parsed.gymId}.${parsed.sig}`;
      } else if (parsed.gymId && allowUnsigned) {
        token = parsed.gymId;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (token.startsWith(QR_PREFIX)) {
    token = token.slice(QR_PREFIX.length).trim();
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const parts = token.split('.');

  // Format: <gymId>.<signature>
  if (parts.length === 2) {
    const [scannedGymId, providedSig] = parts;
    if (!uuidRegex.test(scannedGymId) || !providedSig) {
      return null;
    }

    const expectedSig = computeGymQrSignature(scannedGymId);

    // Ensure identical byte length before timing-safe comparison
    const providedBuf = Buffer.from(providedSig, 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');

    if (providedBuf.length !== expectedBuf.length) {
      return null;
    }

    const isMatch = crypto.timingSafeEqual(providedBuf, expectedBuf);
    return isMatch ? scannedGymId : null;
  }

  // Legacy unsigned mode (only if explicitly enabled via flag/env)
  if (allowUnsigned && parts.length === 1 && uuidRegex.test(parts[0])) {
    return parts[0];
  }

  return null;
};

module.exports = {
  QR_PREFIX,
  computeGymQrSignature,
  createGymQrString,
  verifyAndExtractGymId
};
