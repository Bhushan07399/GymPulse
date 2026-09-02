const { Router } = require('express');
const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { asyncHandler } = require('../middleware/async-handler');
const {
  attendanceIdSchema,
  attendanceListQuerySchema,
  createAttendanceSchema,
  updateAttendanceSchema
} = require('../validations/attendance.validation');
const { validate } = require('../validations/validate');

const attendanceRouter = Router();
const staffAllowed = [authenticate, authorize('Owner', 'Receptionist')];

attendanceRouter.post(
  '/',
  ...staffAllowed,
  validate(createAttendanceSchema),
  asyncHandler(attendanceController.create)
);
attendanceRouter.get(
  '/',
  ...staffAllowed,
  validate(attendanceListQuerySchema),
  asyncHandler(attendanceController.list)
);
attendanceRouter.get(
  '/:id',
  ...staffAllowed,
  validate(attendanceIdSchema),
  asyncHandler(attendanceController.get)
);
attendanceRouter.put(
  '/:id',
  ...staffAllowed,
  validate(updateAttendanceSchema),
  asyncHandler(attendanceController.update)
);
attendanceRouter.delete(
  '/:id',
  ...staffAllowed,
  validate(attendanceIdSchema),
  asyncHandler(attendanceController.remove)
);

module.exports = { attendanceRouter };
