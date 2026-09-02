const {
  createMembershipPlan,
  deleteMembershipPlan,
  listMembershipPlans,
  updateMembershipPlan
} = require('../services/membership-plan.service');
const { buildPagination } = require('../utils/pagination');

const formatMembershipPlan = (plan) => ({
  id: plan.id,
  gymId: plan.gym_id,
  planName: plan.plan_name,
  durationInDays: plan.duration_in_days,
  price: plan.price,
  description: plan.description,
  isActive: plan.is_active,
  createdAt: plan.created_at,
  updatedAt: plan.updated_at
});

const create = async (request, response) => {
  const plan = await createMembershipPlan(request.user.gymId, request.validated.body);

  response.status(201).json({
    success: true,
    message: 'Membership plan created successfully.',
    data: {
      membershipPlan: formatMembershipPlan(plan)
    }
  });
};

const list = async (request, response) => {
  const result = await listMembershipPlans(request.user.gymId, request.validated.query);

  response.status(200).json({
    success: true,
    data: { membershipPlans: result.items.map(formatMembershipPlan) },
    pagination: buildPagination({ ...request.validated.query, total: result.total })
  });
};

const update = async (request, response) => {
  const plan = await updateMembershipPlan(
    request.user.gymId,
    request.validated.params.id,
    request.validated.body
  );

  response.status(200).json({
    success: true,
    message: 'Membership plan updated successfully.',
    data: {
      membershipPlan: formatMembershipPlan(plan)
    }
  });
};

const remove = async (request, response) => {
  await deleteMembershipPlan(request.user.gymId, request.validated.params.id);

  response.status(200).json({
    success: true,
    message: 'Membership plan deleted successfully.'
  });
};

module.exports = { create, list, remove, update };
