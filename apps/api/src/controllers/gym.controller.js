const gymRepository = require('../repositories/gym.repository');
const { AppError } = require('../utils/app-error');

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
  const qrString = `GYMPULSE-GYM:${gymId}`;

  response.status(200).json({
    success: true,
    data: {
      gymId,
      gymName: gym?.name || 'GymPulse Fitness',
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

  const endDate = new Date();
  if (cycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  await pool.query(
    `UPDATE gyms
     SET subscription_plan = $1,
         is_multi_gym = $2,
         max_locations = $3,
         billing_cycle = $4,
         subscription_status = 'ACTIVE',
         subscription_start_date = CURRENT_DATE,
         subscription_end_date = $5::date,
         trial_ends_at = NULL
     WHERE id IN (
       SELECT s.gym_id FROM staff s WHERE LOWER(s.email) = LOWER($6) AND s.role = 'Owner'
     )`,
    [canonicalPlan, multiGym, locationsCount, cycle, endDate.toISOString().slice(0, 10), ownerEmail]
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

module.exports = {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getGymQr,
  triggerManualReminders,
  updateSubscription
};
