const { Router } = require('express');
const memberController = require('../controllers/member.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/async-handler');
const {
  createMemberSchema,
  memberIdSchema,
  memberListQuerySchema,
  updateMemberSchema
} = require('../validations/member.validation');
const { validate } = require('../validations/validate');

const memberRouter = Router();
const staffAllowed = [authenticate, authorize('Owner', 'Receptionist', 'Staff')];

memberRouter.post(
  '/',
  ...staffAllowed,
  validate(createMemberSchema),
  asyncHandler(memberController.create)
);
memberRouter.get(
  '/',
  ...staffAllowed,
  validate(memberListQuerySchema),
  asyncHandler(memberController.list)
);
memberRouter.get(
  '/:id',
  ...staffAllowed,
  validate(memberIdSchema),
  asyncHandler(memberController.get)
);
memberRouter.put(
  '/:id',
  ...staffAllowed,
  validate(updateMemberSchema),
  asyncHandler(memberController.update)
);
memberRouter.delete(
  '/:id',
  ...staffAllowed,
  validate(memberIdSchema),
  asyncHandler(memberController.remove)
);

module.exports = { memberRouter };
