const { z } = require('zod');

const createListQuerySchema = ({ sortFields, statuses }) => z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(sortFields).default(sortFields[0]),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: statuses ? z.enum(statuses).optional() : z.string().trim().max(30).optional()
}).passthrough();

module.exports = { createListQuerySchema };
