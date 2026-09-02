const { z } = require('zod');

const ownerRegistrationSchema = z.object({
  body: z.object({
    gymId: z.string().uuid(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(7).max(30),
    password: z.string().min(8).max(72)
  }),
  params: z.object({}),
  query: z.object({})
});

const ownerLoginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(72)
  }),
  params: z.object({}),
  query: z.object({})
});

module.exports = { ownerLoginSchema, ownerRegistrationSchema };
