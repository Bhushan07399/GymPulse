const { z } = require('zod');
const { createListQuerySchema } = require('./list-query.validation');

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Date must be a valid calendar date.');
const timestamp = z.string().datetime({ offset: true });

const attendanceFields = {
  memberId: z.string().trim().regex(/^(?:[0-9a-fA-F-]{36}|GP\d+|[A-Z0-9]+-\d+)$/i, 'Member ID format is invalid.').transform((value) => value.toUpperCase()),
  checkInTime: timestamp,
  checkOutTime: timestamp.nullable().optional(),
  attendanceDate: isoDate,
  attendanceMethod: z.enum(['QR', 'Barcode', 'NFC', 'Manual']),
  markedByStaffId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional()
};

const validateAttendanceTimes = (value, context) => {
  if (value.checkOutTime && new Date(value.checkOutTime) < new Date(value.checkInTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['checkOutTime'],
      message: 'Check-out time must be on or after check-in time.'
    });
  }
};

const createAttendanceSchema = z.object({
  body: z.object(attendanceFields).strict().superRefine(validateAttendanceTimes),
  params: z.object({}),
  query: z.object({})
});

const updateAttendanceSchema = z.object({
  body: z.object(attendanceFields).partial().strict().refine(
    (value) => Object.keys(value).length > 0,
    'At least one attendance field is required.'
  ).superRefine(validateAttendanceTimes),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});

const attendanceIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});

const attendanceListQuerySchema = z.object({
  // GET requests conventionally have no body. Keeping this optional preserves the
  // route contract while allowing browser clients to make a standards-compliant list request.
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: createListQuerySchema({
    sortFields: ['attendanceDate', 'checkInTime', 'createdAt'],
    statuses: ['QR', 'Barcode', 'NFC', 'Manual']
  })
});

module.exports = {
  attendanceIdSchema,
  attendanceListQuerySchema,
  createAttendanceSchema,
  updateAttendanceSchema
};
