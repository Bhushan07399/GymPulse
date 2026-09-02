const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
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
  asyncHandler(dashboardController.analytics)
);

module.exports = { dashboardRouter };
