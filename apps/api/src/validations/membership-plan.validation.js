const { z } = require('zod');
const { createListQuerySchema } = require('./list-query.validation');

const membershipPlanFields = {
  planName: z.string().trim().min(1).max(100),
  durationInDays: z.coerce.number().int().positive(),
  price: z.coerce.number().finite().min(0),
  description: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional()
};

const createMembershipPlanSchema = z.object({
  body: z.object(membershipPlanFields).extend({
    isActive: z.boolean().optional().default(true)
  }).strict(),
  params: z.object({}),
  query: z.object({})
});

const updateMembershipPlanSchema = z.object({
  body: z.object(membershipPlanFields).partial().strict().refine(
    (value) => Object.keys(value).length > 0,
    'At least one membership plan field is required.'
  ),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});

const membershipPlanIdSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({})
});

const membershipPlanListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}),
  query: createListQuerySchema({
    sortFields: ['createdAt', 'planName', 'durationInDays', 'price'],
    statuses: ['active', 'inactive']
  })
});

module.exports = {
  createMembershipPlanSchema,
  membershipPlanIdSchema,
  membershipPlanListQuerySchema,
  updateMembershipPlanSchema
};
