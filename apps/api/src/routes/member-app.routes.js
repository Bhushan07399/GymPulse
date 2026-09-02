const { Router } = require('express');
const memberAppController = require('../controllers/member-app.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { authorizePlanFeature } = require('../middleware/authorize-plan-feature');
const { asyncHandler } = require('../middleware/async-handler');
const {
  memberLoginSchema,
  memberRenewalSchema,
  receiptIdSchema,
  scanQrSchema,
  addMeasurementSchema,
  addGoalSchema,
  goalIdParamSchema,
  updateGoalStatusSchema,
  updateProfileSchema,
  notificationIdSchema,
  changePasswordSchema
} = require('../validations/member-app.validation');
const { validate } = require('../validations/validate');

const memberAppRouter = Router();

// Member Auth (Public)
memberAppRouter.post(
  '/auth/login',
  validate(memberLoginSchema),
  asyncHandler(memberAppController.login)
);
memberAppRouter.post(
  '/auth/validate-id',
  asyncHandler(memberAppController.validateId)
);

// Member Protected Routes (requires JWT token & 'Member' role)
const memberOnly = [authenticate, authorize('Member')];

memberAppRouter.get('/dashboard', ...memberOnly, asyncHandler(memberAppController.getDashboard));
memberAppRouter.get('/me', ...memberOnly, asyncHandler(memberAppController.getProfile));
memberAppRouter.put(
  '/me',
  ...memberOnly,
  validate(updateProfileSchema),
  asyncHandler(memberAppController.updateProfile)
);

// Membership & Renewal
memberAppRouter.get('/membership', ...memberOnly, asyncHandler(memberAppController.getMembership));
memberAppRouter.get('/membership/plans', ...memberOnly, asyncHandler(memberAppController.getPlansForRenewal));
memberAppRouter.post(
  '/membership/renew',
  ...memberOnly,
  validate(memberRenewalSchema),
  asyncHandler(memberAppController.renewMembership)
);

// Payments & Receipts
memberAppRouter.get('/payments', ...memberOnly, asyncHandler(memberAppController.getPayments));
memberAppRouter.get(
  '/payments/:id',
  ...memberOnly,
  validate(receiptIdSchema),
  asyncHandler(memberAppController.getReceipt)
);

// Digital Pass & QR Code
memberAppRouter.get('/card', ...memberOnly, asyncHandler(memberAppController.getDigitalCard));
memberAppRouter.get('/gym-qr', ...memberOnly, asyncHandler(memberAppController.getGymQrCode));

// QR Attendance Scanner & History (Requires Growth Plan or higher)
memberAppRouter.post(
  '/attendance/scan',
  ...memberOnly,
  authorizePlanFeature('QR_ATTENDANCE'),
  validate(scanQrSchema),
  asyncHandler(memberAppController.scanAttendanceQr)
);
memberAppRouter.get('/attendance', ...memberOnly, asyncHandler(memberAppController.getAttendance));

// Live Gym Crowd & Peak Hours Analytics (Requires Growth Plan or higher)
memberAppRouter.get(
  '/crowd',
  ...memberOnly,
  authorizePlanFeature('LIVE_CROWD'),
  asyncHandler(memberAppController.getCrowd)
);

// Body Measurements (Requires Growth Plan or higher)
memberAppRouter.get(
  '/measurements',
  ...memberOnly,
  authorizePlanFeature('MEASUREMENTS'),
  asyncHandler(memberAppController.getMeasurements)
);
memberAppRouter.post(
  '/measurements',
  ...memberOnly,
  authorizePlanFeature('MEASUREMENTS'),
  validate(addMeasurementSchema),
  asyncHandler(memberAppController.addMeasurement)
);

// Progress Analytics Dashboard (Requires Growth Plan or higher)
memberAppRouter.get(
  '/progress',
  ...memberOnly,
  authorizePlanFeature('PROGRESS_TRACKING'),
  asyncHandler(memberAppController.getProgress)
);

// Fitness Goals (Requires Growth Plan or higher)
memberAppRouter.get(
  '/goals',
  ...memberOnly,
  authorizePlanFeature('FITNESS_GOALS'),
  asyncHandler(memberAppController.getGoals)
);
memberAppRouter.post(
  '/goals',
  ...memberOnly,
  authorizePlanFeature('FITNESS_GOALS'),
  validate(addGoalSchema),
  asyncHandler(memberAppController.addGoal)
);
memberAppRouter.put(
  '/goals/:id/status',
  ...memberOnly,
  authorizePlanFeature('FITNESS_GOALS'),
  validate(updateGoalStatusSchema),
  asyncHandler(memberAppController.updateGoalStatus)
);
memberAppRouter.delete(
  '/goals/:id',
  ...memberOnly,
  authorizePlanFeature('FITNESS_GOALS'),
  validate(goalIdParamSchema),
  asyncHandler(memberAppController.deleteGoal)
);

// Notifications & Inbox
memberAppRouter.get('/notifications', ...memberOnly, asyncHandler(memberAppController.getNotifications));
memberAppRouter.patch(
  '/notifications/read-all',
  ...memberOnly,
  asyncHandler(memberAppController.markAllNotificationsRead)
);
memberAppRouter.patch(
  '/notifications/:id/read',
  ...memberOnly,
  validate(notificationIdSchema),
  asyncHandler(memberAppController.markNotificationRead)
);

// Security & Password Change
memberAppRouter.post(
  '/change-password',
  ...memberOnly,
  validate(changePasswordSchema),
  asyncHandler(memberAppController.changePassword)
);

module.exports = { memberAppRouter };
