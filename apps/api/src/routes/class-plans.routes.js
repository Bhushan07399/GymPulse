const { Router } = require('express');
const classPlansController = require('../controllers/class-plans.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { authorizePlanFeature } = require('../middleware/authorize-plan-feature');
const { asyncHandler } = require('../middleware/async-handler');

const classPlansRouter = Router();
const staffAllowed = [authenticate, authorize('Owner', 'Receptionist', 'Staff'), authorizePlanFeature('CLASSES')];
const memberAllowed = [authenticate, authorize('Member'), authorizePlanFeature('CLASSES')];
const generalStaffAllowed = [authenticate, authorize('Owner', 'Receptionist', 'Staff')];

// Owner / Staff Routes
classPlansRouter.get('/plans', ...staffAllowed, asyncHandler(classPlansController.listClassPlans));
classPlansRouter.post('/plans', ...staffAllowed, asyncHandler(classPlansController.createClassPlan));
classPlansRouter.get('/plans/:id', ...staffAllowed, asyncHandler(classPlansController.getClassPlanById));
classPlansRouter.put('/plans/:id', ...staffAllowed, asyncHandler(classPlansController.updateClassPlan));
classPlansRouter.delete('/plans/:id', ...staffAllowed, asyncHandler(classPlansController.deleteClassPlan));

classPlansRouter.post('/memberships/enroll', ...staffAllowed, asyncHandler(classPlansController.enrollMember));
classPlansRouter.get('/payments/outstanding', ...staffAllowed, asyncHandler(classPlansController.listClassOutstandingDues));
classPlansRouter.post('/payments/record-dues', ...staffAllowed, asyncHandler(classPlansController.recordClassDuesPayment));
classPlansRouter.get('/revenue-overview', ...generalStaffAllowed, asyncHandler(classPlansController.getBusinessRevenueOverview));

// Member Routes
classPlansRouter.get('/member/plans', ...memberAllowed, asyncHandler(classPlansController.getMemberClassPlans));
classPlansRouter.get('/member/class-memberships', ...memberAllowed, asyncHandler(classPlansController.getMemberClassPlans));
classPlansRouter.get('/member/payments', ...memberAllowed, asyncHandler(classPlansController.getMemberClassPayments));

module.exports = { classPlansRouter };
