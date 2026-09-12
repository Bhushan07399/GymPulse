const gymRepository = require('../repositories/gym.repository');
const { AppError } = require('../utils/app-error');
const { createGymQrString } = require('../utils/gym-qr');

const getProfile = async (request, response) => {
  const profile = await gymRepository.findProfileById(request.user.gymId);

  if (!profile) {
    throw new AppError(404, 'Gym profile not found');
  }

  response.status(200).json({
    success: true,
    data: { profile }
  });
};

const updateProfile = async (request, response) => {
  const profile = await gymRepository.updateProfileById(request.user.gymId, request.validated.body);

  if (!profile) {
    throw new AppError(404, 'Gym profile not found');
  }

  response.status(200).json({
    success: true,
    message: 'Gym profile updated successfully',
    data: { profile }
  });
};

const getSettings = async (request, response) => {
  const settings = await gymRepository.getSettings(request.user.gymId);

  response.status(200).json({
    success: true,
    data: { settings }
  });
};

const updateSettings = async (request, response) => {
  const settings = await gymRepository.updateSettings(request.user.gymId, request.validated.body);

  response.status(200).json({
    success: true,
    message: 'Gym settings updated successfully',
    data: { settings }
  });
};

const getGymQr = async (request, response) => {
  const gymId = request.user.gymId;
  const gym = await gymRepository.findProfileById(gymId);
  const qrString = createGymQrString(gymId);

  response.status(200).json({
    success: true,
    data: {
      gymId,
      gymName: gym?.name || 'My Gym',
      gymQrString: qrString,
      subscriptionPlan: gym?.subscription_plan || 'Basic',
      instructions: 'Display this Gym QR Code at reception for member mobile check-in scanning.'
    }
  });
};

const triggerManualReminders = async (request, response) => {
  const { runAutomatedNotifications } = require('../services/notification-scheduler.service');
  const result = await runAutomatedNotifications();

  response.status(200).json({
    success: true,
    message: 'Automated notification detector executed.',
    data: result
  });
};

const updateSubscription = async (request, response) => {
  const { pool } = require('../db/pool');
  const { calculateSubscriptionPrice } = require('../config/pricing');
  const gymId = request.user.gymId;
  const ownerEmail = request.user.email;

  const { plan = 'Growth', isMultiGym = false, maxLocations = 1, billingCycle = 'monthly' } = request.body;

  let canonicalPlan = 'Growth';
  const lower = String(plan).toLowerCase();
  if (lower.includes('class')) {
    canonicalPlan = 'Gym + Classes';
  } else if (lower.includes('pro')) {
    canonicalPlan = 'Pro';
  }

  const multiGym = Boolean(isMultiGym && Number(maxLocations) > 1);
  const locationsCount = multiGym ? Math.max(2, Math.min(10, Number(maxLocations) || 2)) : 1;
  const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';

  const pricing = calculateSubscriptionPrice(canonicalPlan, multiGym, locationsCount, cycle);
  const amountPaid = pricing.price || 0;

  await pool.query(
    `UPDATE gyms
     SET subscription_plan = $1,
         is_multi_gym = $2,
         max_locations = $3,
         billing_cycle = $4,
         subscription_status = 'ACTIVE',
         subscription_start_date = CURRENT_DATE,
         subscription_end_date = CASE WHEN $4 = 'yearly' THEN (CURRENT_DATE + INTERVAL '1 year') ELSE (CURRENT_DATE + INTERVAL '1 month') END,
         trial_ends_at = NULL
     WHERE id IN (
       SELECT s.gym_id FROM staff s WHERE LOWER(s.email) = LOWER($5) AND s.role = 'Owner'
     )`,
    [canonicalPlan, multiGym, locationsCount, cycle, ownerEmail]
  );

  await pool.query(
    `INSERT INTO gym_subscription_history (
       gym_id, plan, is_multi_gym, max_locations, billing_cycle, start_date, end_date, amount_paid
     )
     SELECT g.id, $1, $2, $3, $4, CURRENT_DATE,
            CASE WHEN $4 = 'yearly' THEN (CURRENT_DATE + INTERVAL '1 year') ELSE (CURRENT_DATE + INTERVAL '1 month') END,
            $5
     FROM gyms g
     WHERE g.id IN (
       SELECT s.gym_id FROM staff s WHERE LOWER(s.email) = LOWER($6) AND s.role = 'Owner'
     )`,
    [canonicalPlan, multiGym, locationsCount, cycle, amountPaid, ownerEmail]
  );

  response.status(200).json({
    success: true,
    message: `Subscription successfully updated to ${canonicalPlan} (${multiGym ? `${locationsCount} locations, ` : ''}${cycle}).`,
    data: {
      plan: canonicalPlan,
      isMultiGym: multiGym,
      maxLocations: locationsCount,
      billingCycle: cycle,
      pricing
    }
  });
};

const getSubscriptionHistory = async (request, response) => {
  const { pool } = require('../db/pool');
  const gymId = request.user.gymId;

  const result = await pool.query(
    `SELECT id, gym_id, plan, is_multi_gym, max_locations, billing_cycle,
            TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
            amount_paid, created_at
     FROM gym_subscription_history
     WHERE gym_id = $1
     ORDER BY created_at DESC`,
    [gymId]
  );

  response.status(200).json({
    success: true,
    data: {
      history: result.rows
    }
  });
};

module.exports = {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getGymQr,
  triggerManualReminders,
  updateSubscription,
  getSubscriptionHistory
};
