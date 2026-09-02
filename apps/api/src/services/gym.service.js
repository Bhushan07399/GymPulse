const gymRepository = require('../repositories/gym.repository');
const { AppError } = require('../utils/app-error');

const getGymProfile = async (gymId) => {
  const gym = await gymRepository.findProfileById(gymId);

  if (!gym) {
    throw new AppError(404, 'Gym not found.');
  }

  return gym;
};

const updateGymProfile = async (gymId, profile) => {
  try {
    const gym = await gymRepository.updateProfileById(gymId, profile);

    if (!gym) {
      throw new AppError(404, 'Gym not found.');
    }

    return gym;
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'A gym with this email already exists.');
    }

    throw error;
  }
};

const getGymSettings = (gymId) => gymRepository.getSettings(gymId);
const updateGymSettings = (gymId, settings) => gymRepository.updateSettings(gymId, settings);
module.exports = { getGymProfile, updateGymProfile, getGymSettings, updateGymSettings };
