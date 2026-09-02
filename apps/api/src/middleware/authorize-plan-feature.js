const { pool } = require('../db/pool');
const { logger } = require('../config/logger');
const { AppError } = require('../utils/app-error');

const PLAN_HIERARCHY = {
  Basic: 1,
  BASIC: 1,
  Growth: 2,
  GROWTH: 2,
  Standard: 2,
  STANDARD: 2,
  Pro: 3,
  PRO: 3,
  Premium: 4,
  PREMIUM: 4,
  'Gym + Classes': 4,
  'GYM + CLASSES': 4,
  'Gym + Classes ₹4,999': 4,
  'Gym + Classes (₹4,999)': 4,
  'Classes All-Access': 4,
  Ultra: 4
};

const FEATURE_PLAN_REQUIREMENT = {
  QR_ATTENDANCE: 'Growth',
  LIVE_CROWD: 'Growth',
  PEAK_HOURS: 'Growth',
  MEASUREMENTS: 'Growth',
  PROGRESS_TRACKING: 'Growth',
  FITNESS_GOALS: 'Growth',
  ADVANCED_REPORTS: 'Growth',
  WHATSAPP_AUTOMATION: 'Pro',
  ADVANCED_ANALYTICS: 'Pro',
  CLASSES: 'Gym + Classes',
  CLASSES_MODULE: 'Gym + Classes',
  TRAINER_SYSTEM: 'Gym + Classes',
  DIET_SYSTEM: 'Gym + Classes',
  WORKOUT_V2: 'Gym + Classes'
};

const getPlanRank = (planName) => {
  if (!planName) return 1;
  const str = String(planName).trim();
  if (PLAN_HIERARCHY[str]) return PLAN_HIERARCHY[str];

  const lower = str.toLowerCase();
  if (
    lower.includes('class') ||
    lower.includes('premium') ||
    lower.includes('4,999') ||
    lower.includes('4999') ||
    lower.includes('ultra') ||
    lower.includes('all-access')
  ) {
    return 4;
  }
  if (lower.includes('pro')) {
    return 3;
  }
  if (lower.includes('growth') || lower.includes('standard')) {
    return 2;
  }
  return 1;
};

const authorizePlanFeature = (featureName) => async (req, res, next) => {
  const gymId = req.user?.gymId;
  if (!gymId) {
    logger.debug({ path: req.originalUrl, featureName }, '[AUTH DEBUG] Plan feature check failed: Missing gymId context');
    return next(new AppError(401, 'Unauthorized: Gym context required.'));
  }

  try {
    const result = await pool.query(
      `SELECT subscription_plan, subscription_end_date 
       FROM gyms 
       WHERE id = $1 AND deleted_at IS NULL 
       LIMIT 1`,
      [gymId]
    );

    const gym = result.rows[0];
    const currentPlan = gym?.subscription_plan || 'Basic';
    const requiredPlan = FEATURE_PLAN_REQUIREMENT[featureName] || 'Basic';

    let isExpired = false;
    if (gym?.subscription_end_date) {
      const endDate = new Date(gym.subscription_end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate < today) {
        isExpired = true;
      }
    }

    const currentRank = isExpired ? 0 : getPlanRank(currentPlan);
    const requiredRank = getPlanRank(requiredPlan);

    if (currentRank < requiredRank) {
      logger.debug({
        path: req.originalUrl,
        userId: req.user?.id,
        gymId,
        role: req.user?.role,
        requiredEntitlement: featureName,
        requiredPlan,
        currentPlan,
        currentRank,
        requiredRank,
        isExpired,
        authorizationResult: 'REJECTED_FEATURE_LOCKED'
      }, '[AUTH DEBUG] Feature locked for gym plan');

      return res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_LOCKED',
          message: isExpired
            ? `Your subscription has expired. Please renew to access ${featureName}.`
            : `Feature '${featureName}' is available on the Gym + Classes (₹4,999) plan. Current plan: ${currentPlan}.`,
          requiredPlan,
          currentPlan,
          isExpired
        }
      });
    }

    logger.debug({
      path: req.originalUrl,
      userId: req.user?.id,
      gymId,
      role: req.user?.role,
      requiredEntitlement: featureName,
      currentPlan,
      authorizationResult: 'GRANTED'
    }, '[AUTH DEBUG] Feature entitlement check granted');

    req.gymSubscriptionPlan = currentPlan;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authorizePlanFeature, FEATURE_PLAN_REQUIREMENT, PLAN_HIERARCHY, getPlanRank };
