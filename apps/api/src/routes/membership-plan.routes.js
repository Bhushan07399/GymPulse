const { Router } = require('express');
const { create, list, remove, update } = require('../controllers/membership-plan.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/async-handler');
const {
  createMembershipPlanSchema,
  membershipPlanIdSchema,
  membershipPlanListQuerySchema,
  updateMembershipPlanSchema
} = require('../validations/membership-plan.validation');
const { validate } = require('../validations/validate');

const membershipPlanRouter = Router();
const staffAllowed = [authenticate, authorize('Owner', 'Receptionist', 'Staff')];

membershipPlanRouter.get(
  '/',
  ...staffAllowed,
  validate(membershipPlanListQuerySchema),
  asyncHandler(list)
);

membershipPlanRouter.post(
  '/',
  ...staffAllowed,
  validate(createMembershipPlanSchema),
  asyncHandler(create)
);

membershipPlanRouter.put(
  '/:id',
  ...staffAllowed,
  validate(updateMembershipPlanSchema),
  asyncHandler(update)
);

membershipPlanRouter.delete(
  '/:id',
  ...staffAllowed,
  validate(membershipPlanIdSchema),
  asyncHandler(remove)
);

module.exports = { membershipPlanRouter };
