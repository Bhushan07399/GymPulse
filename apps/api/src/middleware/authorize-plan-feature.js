const { pool } = require('../db/pool');
const { logger } = require('../config/logger');
const { AppError } = require('../utils/app-error');

const resolveCanonicalPlan = (rawPlan) => {
  if (!rawPlan) return 'Growth';
  const lower = String(rawPlan).trim().toLowerCase();

  if (lower.includes('class')) {
    return 'Gym + Classes';
  }
  if (lower.includes('pro')) {
    return 'Pro';
  }
  if (lower.includes('growth') || lower.includes('basic') || lower.includes('standard')) {
    return 'Growth';
  }
  return 'Growth';
};

const PLAN_RANKS = {
  Growth: 1,
  Pro: 2,
  'Gym + Classes': 3
};

const FEATURE_PLAN_REQUIREMENT = {
  QR_ATTENDANCE: 'Growth',
  LIVE_CROWD: 'Growth',
  PEAK_HOURS: 'Growth',
  MEASUREMENTS: 'Growth',
  PROGRESS_TRACKING: 'Growth',
  FITNESS_GOALS: 'Growth',
  BASIC_REPORTS: 'Growth',
  STAFF_MANAGEMENT: 'Pro',
  WHATSAPP_AUTOMATION: 'Pro',
  ADVANCED_ANALYTICS: 'Pro',
  ADVANCED_REPORTS: 'Pro',
  CLASSES: 'Gym + Classes',
  CLASSES_MODULE: 'Gym + Classes',
  CLASS_PLANS: 'Gym + Classes',
  TRAINER_SYSTEM: 'Gym + Classes',
  DIET_SYSTEM: 'Gym + Classes',
  WORKOUT_V2: 'Gym + Classes'
};

const getPlanRank = (planName) => {
  const canonical = resolveCanonicalPlan(planName);
  return PLAN_RANKS[canonical] || 1;
};

const authorizePlanFeature = (featureName) => async (req, res, next) => {
  const gymId = req.user?.gymId;
  if (!gymId) {
    logger.debug({ path: req.originalUrl, featureName }, '[AUTH DEBUG] Plan feature check failed: Missing gymId context');
    return next(new AppError(401, 'Unauthorized: Gym context required.'));
  }

  try {
    const result = await pool.query(
      `SELECT subscription_plan, subscription_end_date, subscription_status, trial_started_at, trial_ends_at 
       FROM gyms 
       WHERE id = $1 AND deleted_at IS NULL 
       LIMIT 1`,
      [gymId]
    );

    const gym = result.rows[0];
    const now = new Date();
    const status = gym?.subscription_status || 'ACTIVE';
    const trialEndsAt = gym?.trial_ends_at ? new Date(gym.trial_ends_at) : null;
    const subEndDate = gym?.subscription_end_date ? new Date(gym.subscription_end_date) : null;

    let isTrialActive = false;
    let isTrialExpired = false;
    let isSubExpired = false;

    if (status === 'TRIAL') {
      if (trialEndsAt && now < trialEndsAt) {
        isTrialActive = true;
      } else {
        isTrialExpired = true;
      }
    } else if (status === 'ACTIVE') {
      if (subEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (subEndDate < today) {
          isSubExpired = true;
        }
      }
    } else if (status === 'EXPIRED') {
      isSubExpired = true;
    }

    let currentRank = 0;
    let currentPlan = gym?.subscription_plan || 'Growth';

    if (isTrialActive) {
      currentRank = 1; // Growth trial only
      currentPlan = 'Growth (Trial)';
    } else if (isTrialExpired || isSubExpired) {
      currentRank = 0; // Lock all protected features
    } else {
      currentRank = getPlanRank(currentPlan);
    }

    const requiredPlan = FEATURE_PLAN_REQUIREMENT[featureName] || 'Growth';
    const requiredRank = getPlanRank(requiredPlan);

    if (currentRank === 0) {
      logger.debug({
        path: req.originalUrl,
        userId: req.user?.id,
        gymId,
        role: req.user?.role,
        featureName,
        status,
        isTrialExpired,
        isSubExpired
      }, '[AUTH DEBUG] Subscription required: trial or subscription expired');

      return res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Your 3-day free trial or subscription has expired. Please select a subscription plan to continue using GymPulse.',
          requiredPlan,
          currentPlan,
          isExpired: true
        }
      });
    }

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
        authorizationResult: 'REJECTED_FEATURE_LOCKED'
      }, '[AUTH DEBUG] Feature locked for gym plan');

      return res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_LOCKED',
          message: `Feature '${featureName}' is available on the ${requiredPlan} plan. Current plan: ${currentPlan}.`,
          requiredPlan,
          currentPlan,
          isExpired: false
        }
      });
    }

    req.gymSubscriptionPlan = currentPlan;
    next();
  } catch (err) {
    next(err);
  }
};

const ensureGymSubscriptionActive = async (req, res, next) => {
  const gymId = req.user?.gymId;
  if (!gymId) return next(new AppError(401, 'Unauthorized: Gym context required.'));

  try {
    const result = await pool.query(
      `SELECT subscription_plan, subscription_end_date, subscription_status, trial_started_at, trial_ends_at 
       FROM gyms 
       WHERE id = $1 AND deleted_at IS NULL 
       LIMIT 1`,
      [gymId]
    );

    const gym = result.rows[0];
    const now = new Date();
    const status = gym?.subscription_status || 'ACTIVE';
    const trialEndsAt = gym?.trial_ends_at ? new Date(gym.trial_ends_at) : null;
    const subEndDate = gym?.subscription_end_date ? new Date(gym.subscription_end_date) : null;

    let isTrialExpired = false;
    let isSubExpired = false;

    if (status === 'TRIAL') {
      if (!trialEndsAt || now >= trialEndsAt) isTrialExpired = true;
    } else if (status === 'ACTIVE') {
      if (subEndDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (subEndDate < today) isSubExpired = true;
      }
    } else if (status === 'EXPIRED') {
      isSubExpired = true;
    }

    if (isTrialExpired || isSubExpired) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Your 3-day free trial or subscription has expired. Please select a subscription plan to continue using GymPulse.',
          isExpired: true
        }
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authorizePlanFeature,
  ensureGymSubscriptionActive,
  FEATURE_PLAN_REQUIREMENT,
  PLAN_RANKS,
  getPlanRank,
  resolveCanonicalPlan
};
