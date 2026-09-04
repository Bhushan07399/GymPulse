const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { authorizePlanFeature } = require('../middleware/authorize-plan-feature');
const { asyncHandler } = require('../middleware/async-handler');

const dashboardRouter = Router();

dashboardRouter.get(
  '/summary',
  authenticate,
  authorize('Owner', 'Receptionist'),
  asyncHandler(dashboardController.summary)
);

dashboardRouter.get(
  '/analytics',
  authenticate,
  authorize('Owner', 'Receptionist'),
  authorizePlanFeature('ADVANCED_ANALYTICS'),
  asyncHandler(dashboardController.analytics)
);

dashboardRouter.get(
  '/consolidated',
  authenticate,
  authorize('Owner'),
  asyncHandler(dashboardController.consolidated)
);

module.exports = { dashboardRouter };
