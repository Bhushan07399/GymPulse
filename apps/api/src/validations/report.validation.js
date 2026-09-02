const { z } = require('zod');

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const reportListSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: z.object({
    type: z.enum(['member', 'payment', 'attendance', 'revenue']).default('member'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(10).max(100).default(20),
    sortBy: z.enum(['name', 'expiry', 'joinDate', 'revenue']).default('name'),
    order: z.enum(['asc', 'desc']).default('asc'),
    startDate: date,
    endDate: date,
    planId: z.string().uuid().optional(),
    memberStatus: z.enum(['active', 'expired', 'due']).optional(),
    paymentStatus: z.enum(['Pending', 'Paid', 'Failed', 'Refunded']).optional(),
    search: z.string().trim().max(100).optional()
  }).strict().refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, 'End date must not be before start date.')
});

module.exports = { reportListSchema };
