const { z } = require('zod');
const { createListQuerySchema } = require('./list-query.validation');

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Date must be a valid calendar date.');

const paymentFields = {
  memberId: z.string().trim().regex(/^(?:[0-9a-fA-F-]{36}|GP\d+|[A-Z0-9]+-\d+)$/i, 'Member ID format is invalid.').transform((value) => value.toUpperCase()),
  membershipPlanId: z.string().uuid(),
  paymentAmount: z.coerce.number().finite().min(0),
  discountAmount: z.coerce.number().finite().min(0).default(0),
  taxAmount: z.coerce.number().finite().min(0).default(0),
  totalAmount: z.coerce.number().finite().min(0),
  paymentMethod: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']),
  paymentStatus: z.enum(['Pending', 'Paid', 'Failed', 'Refunded']),
  transactionReference: z.string().trim().max(255).nullable().optional(),
  paymentDate: isoDate,
  nextDueDate: isoDate,
  collectedByStaffId: z.string().uuid(),
  notes: z.string().trim().max(5000).nullable().optional()
};

const toCents = (value) => Math.round(value * 100);

const validatePaymentAmountsAndDates = (value, context) => {
  if (
    value.paymentAmount !== undefined &&
    value.discountAmount !== undefined &&
    value.taxAmount !== undefined &&
    value.totalAmount !== undefined &&
    toCents(value.totalAmount) !==
      toCents(value.paymentAmount - value.discountAmount + value.taxAmount)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalAmount'],
      message: 'Total amount must equal payment amount minus discount plus tax.'
    });
  }

  if (
    value.paymentDate !== undefined &&
    value.nextDueDate !== undefined &&
    value.nextDueDate < value.paymentDate
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nextDueDate'],
      message: 'Next due date must be on or after the payment date.'
    });
  }
};

const createPaymentSchema = z.object({
  body: z.object(paymentFields).strict().superRefine(validatePaymentAmountsAndDates),
  params: z.object({}),
  query: z.object({})
});

const updatePaymentSchema = z.object({
  body: z.object(paymentFields).partial().strict().refine(
    (value) => Object.keys(value).length > 0,
    'At least one payment field is required.'
  ).superRefine(validatePaymentAmountsAndDates),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});

const paymentIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});

const paymentListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: createListQuerySchema({
    sortFields: ['paymentDate', 'totalAmount', 'createdAt'],
    statuses: ['Pending', 'Paid', 'Failed', 'Refunded']
  })
});

module.exports = {
  createPaymentSchema,
  paymentIdSchema,
  paymentListQuerySchema,
  updatePaymentSchema
};
