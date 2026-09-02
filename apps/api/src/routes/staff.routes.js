const { Router } = require('express');
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { authorizePlanFeature } = require('../middleware/authorize-plan-feature');
const { asyncHandler } = require('../middleware/async-handler');

const staffRouter = Router();

// Staff Management endpoints: Owner ONLY (Requires Pro Plan or higher)
const ownerOnly = [authenticate, authorize('Owner'), authorizePlanFeature('STAFF_MANAGEMENT')];

staffRouter.get('/', ...ownerOnly, asyncHandler(staffController.list));
staffRouter.post('/', ...ownerOnly, asyncHandler(staffController.create));
staffRouter.get('/:id', ...ownerOnly, asyncHandler(staffController.get));
staffRouter.put('/:id', ...ownerOnly, asyncHandler(staffController.update));
staffRouter.patch('/:id/status', ...ownerOnly, asyncHandler(staffController.updateStatus));
staffRouter.patch('/:id/password', ...ownerOnly, asyncHandler(staffController.resetPassword));
staffRouter.delete('/:id', ...ownerOnly, asyncHandler(staffController.remove));

module.exports = { staffRouter };
