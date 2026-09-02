const { z } = require('zod');
const { createListQuerySchema } = require('./list-query.validation');

const isoDate = z
  .string()
  .transform((val) => (val && val.includes('T') ? val.split('T')[0] : val))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.'));

const memberFields = {
  membershipPlanId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  dateOfBirth: isoDate.optional().or(z.literal('')),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(255).optional().or(z.literal('')).transform((value) => (value ? value.toLowerCase() : '')),
  emergencyContact: z.string().trim().max(255).optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  joinDate: isoDate,
  expiryDate: isoDate.optional(),
  qrCode: z.string().trim().max(255).optional(),
  profilePhotoUrl: z.string().trim().max(2048).optional().or(z.literal('')),
  medicalNotes: z.string().trim().max(5000).optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
  paymentStatus: z.enum(['Paid', 'Partial', 'Unpaid']).optional().default('Paid'),
  amountPaid: z.number().min(0).optional(),
  paymentMethod: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']).optional().default('Cash')
};

const createMemberSchema = z.object({
  body: z.object(memberFields),
  params: z.object({}),
  query: z.object({})
});

const memberIdRegex = /^(?:[0-9a-fA-F-]{36}|GP\d+|[A-Z0-9]+-\d+)$/;

const updateMemberSchema = z.object({
  body: z.object(memberFields).partial(),
  params: z.object({ id: z.string().trim().regex(memberIdRegex, 'Member ID is invalid.') }),
  query: z.object({}).optional().default({})
});

const memberIdSchema = z.object({
  body: z.any().optional(),
  params: z.object({ id: z.string().trim().regex(memberIdRegex, 'Member ID is invalid.') }),
  query: z.object({}).optional().default({})
});

const memberListQuerySchema = z.object({
  body: z.any().optional(),
  params: z.object({}),
  query: createListQuerySchema({
    sortFields: ['createdAt', 'firstName', 'expiryDate'],
    statuses: ['active', 'inactive', 'expired']
  })
});

module.exports = {
  createMemberSchema,
  memberIdSchema,
  memberListQuerySchema,
  updateMemberSchema
};
