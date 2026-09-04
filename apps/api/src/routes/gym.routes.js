const { Router } = require('express');
const { getProfile, updateProfile, getSettings, updateSettings, getGymQr, triggerManualReminders, updateSubscription } = require('../controllers/gym.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { authorizePlanFeature } = require('../middleware/authorize-plan-feature');
const { asyncHandler } = require('../middleware/async-handler');
const { updateGymProfileSchema, updateGymSettingsSchema } = require('../validations/gym.validation');
const { validate } = require('../validations/validate');

const { createLocation } = require('../controllers/auth.controller');

const gymRouter = Router();

gymRouter.get('/profile', authenticate, asyncHandler(getProfile));
gymRouter.put(
  '/profile',
  authenticate,
  authorize('Owner'),
  validate(updateGymProfileSchema),
  asyncHandler(updateProfile)
);
gymRouter.get('/settings', authenticate, authorize('Owner'), asyncHandler(getSettings));
gymRouter.put('/settings', authenticate, authorize('Owner'), validate(updateGymSettingsSchema), asyncHandler(updateSettings));
gymRouter.get('/qr', authenticate, authorize('Owner', 'Receptionist'), authorizePlanFeature('QR_ATTENDANCE'), asyncHandler(getGymQr));
gymRouter.post('/trigger-reminders', authenticate, authorize('Owner', 'Receptionist'), asyncHandler(triggerManualReminders));
gymRouter.post('/create-location', authenticate, authorize('Owner'), asyncHandler(createLocation));
gymRouter.post('/subscription', authenticate, authorize('Owner'), asyncHandler(updateSubscription));

module.exports = { gymRouter };
