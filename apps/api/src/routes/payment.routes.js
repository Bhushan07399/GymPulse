const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/async-handler');
const {
  createPaymentSchema,
  paymentIdSchema,
  paymentListQuerySchema,
  updatePaymentSchema
} = require('../validations/payment.validation');
const { validate } = require('../validations/validate');

const paymentRouter = Router();
const staffAllowed = [authenticate, authorize('Owner', 'Receptionist')];

paymentRouter.post(
  '/',
  ...staffAllowed,
  validate(createPaymentSchema),
  asyncHandler(paymentController.create)
);
paymentRouter.get(
  '/',
  ...staffAllowed,
  validate(paymentListQuerySchema),
  asyncHandler(paymentController.list)
);
paymentRouter.get(
  '/outstanding',
  ...staffAllowed,
  asyncHandler(paymentController.getOutstanding)
);
paymentRouter.get(
  '/:id',
  ...staffAllowed,
  validate(paymentIdSchema),
  asyncHandler(paymentController.get)
);
paymentRouter.put(
  '/:id',
  ...staffAllowed,
  validate(updatePaymentSchema),
  asyncHandler(paymentController.update)
);
paymentRouter.delete(
  '/:id',
  ...staffAllowed,
  validate(paymentIdSchema),
  asyncHandler(paymentController.remove)
);

module.exports = { paymentRouter };
