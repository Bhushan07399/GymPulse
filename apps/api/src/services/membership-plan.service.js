const membershipPlanRepository = require('../repositories/membership-plan.repository');
const { AppError } = require('../utils/app-error');

const createMembershipPlan = (gymId, plan) =>
  membershipPlanRepository.createMembershipPlan({ gymId, ...plan });

const listMembershipPlans = (gymId, query) =>
  membershipPlanRepository.listMembershipPlans(gymId, query);

const updateMembershipPlan = async (gymId, planId, changes) => {
  const plan = await membershipPlanRepository.updateMembershipPlanById(gymId, planId, changes);

  if (!plan) {
    throw new AppError(404, 'Membership plan not found.');
  }

  return plan;
};

const deleteMembershipPlan = async (gymId, planId) => {
  const plan = await membershipPlanRepository.softDeleteMembershipPlan(gymId, planId);

  if (!plan) {
    throw new AppError(404, 'Membership plan not found.');
  }
};

module.exports = {
  createMembershipPlan,
  deleteMembershipPlan,
  listMembershipPlans,
  updateMembershipPlan
};
