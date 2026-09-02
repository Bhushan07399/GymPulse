const { Router } = require('express');
const classesController = require('../controllers/classes.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { authorizePlanFeature } = require('../middleware/authorize-plan-feature');
const { asyncHandler } = require('../middleware/async-handler');

const classesRouter = Router();
const staffAllowed = [authenticate, authorize('Owner', 'Receptionist', 'Staff'), authorizePlanFeature('CLASSES')];
const memberAllowed = [authenticate, authorize('Member'), authorizePlanFeature('CLASSES')];

// Owner / Staff Routes
classesRouter.get('/dashboard', ...staffAllowed, asyncHandler(classesController.getDashboardKPIs));
classesRouter.get('/schedule', ...staffAllowed, asyncHandler(classesController.getWeeklySchedule));
classesRouter.get('/bookings', ...staffAllowed, asyncHandler(classesController.listBookings));
classesRouter.put('/bookings/:bookingId/status', ...staffAllowed, asyncHandler(classesController.updateBookingStatus));
classesRouter.post('/attendance', ...staffAllowed, asyncHandler(classesController.markAttendance));
classesRouter.get('/analytics', ...staffAllowed, asyncHandler(classesController.getClassAnalytics));
classesRouter.get('/sessions/:sessionId/qr', ...staffAllowed, asyncHandler(classesController.getSessionQR));

classesRouter.get('/', ...staffAllowed, asyncHandler(classesController.listClasses));
classesRouter.post('/', ...staffAllowed, asyncHandler(classesController.createClass));
classesRouter.get('/:id', ...staffAllowed, asyncHandler(classesController.getClassById));
classesRouter.put('/:id', ...staffAllowed, asyncHandler(classesController.updateClass));
classesRouter.delete('/:id', ...staffAllowed, asyncHandler(classesController.removeClass));

// Member Routes
classesRouter.get('/member/browse', ...memberAllowed, asyncHandler(classesController.getMemberClasses));
classesRouter.get('/member/my-bookings', ...memberAllowed, asyncHandler(classesController.getMemberBookings));
classesRouter.get('/member/attendance', ...memberAllowed, asyncHandler(classesController.getMemberAttendance));
classesRouter.post('/member/book', ...memberAllowed, asyncHandler(classesController.memberBookClass));
classesRouter.delete('/member/bookings/:id', ...memberAllowed, asyncHandler(classesController.memberCancelBooking));
classesRouter.post('/member/scan-qr', ...memberAllowed, asyncHandler(classesController.memberScanClassQR));
classesRouter.post('/member/checkout', ...memberAllowed, asyncHandler(classesController.memberCheckoutClass));

module.exports = { classesRouter };
