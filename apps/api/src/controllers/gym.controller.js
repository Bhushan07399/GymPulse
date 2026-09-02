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

module.exports = { getProfile, updateProfile, getSettings, updateSettings, getGymQr, triggerManualReminders };
