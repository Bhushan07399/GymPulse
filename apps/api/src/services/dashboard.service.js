const dashboardRepository = require('../repositories/dashboard.repository');
const { AppError } = require('../utils/app-error');

const getSummary = async (gymId) => {
  const summary = await dashboardRepository.getSummary(gymId);

  if (!summary) {
    throw new AppError(404, 'Gym not found.');
  }

  return summary;
};

const getAnalytics = async (gymId, params = {}) => {
  return dashboardRepository.getAnalytics(gymId, params);
};

module.exports = { getSummary, getAnalytics };
