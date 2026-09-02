const { z } = require('zod');

const memberLoginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ required_error: 'Member ID or Phone number is required.' })
      .trim()
      .min(1, 'Member ID or Phone number is required.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .trim()
      .min(1, 'Password is required.')
  })
});

const memberRenewalSchema = z.object({
  body: z.object({
    membershipPlanId: z
      .string({ required_error: 'Membership Plan ID is required.' })
      .uuid('Invalid Membership Plan ID format.'),
    paymentMethod: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']).optional()
  })
});

const receiptIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Receipt ID format.')
  })
});

const scanQrSchema = z.object({
  body: z.object({
    qrPayload: z
      .string({ required_error: 'QR payload code is required.' })
      .trim()
      .min(1, 'QR payload code is required.')
  })
});

const addMeasurementSchema = z.object({
  body: z.object({
    measurementDate: z.string().optional(),
    weight: z.number().positive('Weight must be a positive number.').optional().nullable(),
    height: z.number().positive('Height must be a positive number.').optional().nullable(),
    chest: z.number().positive('Chest measurement must be positive.').optional().nullable(),
    waist: z.number().positive('Waist measurement must be positive.').optional().nullable(),
    hips: z.number().positive('Hips measurement must be positive.').optional().nullable(),
    biceps: z.number().positive('Biceps measurement must be positive.').optional().nullable(),
    thighs: z.number().positive('Thighs measurement must be positive.').optional().nullable(),
    bodyFatPercentage: z.number().min(0).max(100).optional().nullable(),
    muscleMass: z.number().positive().optional().nullable(),
    notes: z.string().optional().nullable()
  })
});

const addGoalSchema = z.object({
  body: z.object({
    goalType: z.enum(['Weight', 'Body Fat %', 'Waist', 'Attendance', 'Custom']),
    title: z.string({ required_error: 'Goal title is required.' }).trim().min(1),
    targetValue: z.number({ required_error: 'Target value is required.' }),
    startingValue: z.number({ required_error: 'Starting value is required.' }),
    currentValue: z.number().optional(),
    unit: z.string().optional(),
    targetDate: z.string({ required_error: 'Target completion date is required.' })
  })
});

const goalIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Goal ID format.')
  })
});

const updateGoalStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Goal ID format.')
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED'])
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: z.string().email('Invalid email address format.').optional(),
    phone: z.string().trim().min(7, 'Invalid phone number length.').optional(),
    profilePhotoUrl: z.string().optional().nullable()
  })
});

const notificationIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Notification ID format.')
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required.' }).min(1),
    newPassword: z
      .string({ required_error: 'New password is required.' })
      .min(6, 'New password must be at least 6 characters long.')
  })
});

module.exports = {
  memberLoginSchema,
  memberRenewalSchema,
  receiptIdSchema,
  scanQrSchema,
  addMeasurementSchema,
  addGoalSchema,
  goalIdParamSchema,
  updateGoalStatusSchema,
  updateProfileSchema,
  notificationIdSchema,
  changePasswordSchema
};
