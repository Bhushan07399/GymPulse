const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/async-handler');
const { reportListSchema } = require('../validations/report.validation');
const { validate } = require('../validations/validate');

const reportRouter = Router();
const staffAllowed = [authenticate, authorize('Owner', 'Receptionist', 'Staff')];

reportRouter.get(
  '/',
  ...staffAllowed,
  validate(reportListSchema),
  asyncHandler(reportController.list)
);

reportRouter.get(
  '/export',
  ...staffAllowed,
  validate(reportListSchema),
  asyncHandler(reportController.exportData)
);

module.exports = { reportRouter };
