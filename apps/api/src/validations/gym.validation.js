const { z } = require('zod');

const isImageOrUrl = (value) => !value || value.startsWith('data:image/') || /^https?:\/\//.test(value);
const isOptionalUrl = (value) => !value || /^https?:\/\//.test(value);

const dayScheduleSchema = z.object({
  isOpen: z.boolean().default(true),
  openTime: z.string().trim().default('06:00'),
  closeTime: z.string().trim().default('22:00')
}).partial().optional();

const operatingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema
}).partial().nullable().optional();

const updateGymProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    owner_name: z.string().trim().min(1).max(255).optional(),
    phone: z.string().trim().min(7).max(30).optional(),
    email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()).optional(),
    address: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    state: z.string().trim().min(1).max(100).optional(),
    country: z.string().trim().min(1).max(100).optional(),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be a 6-digit value.').optional(),
    gst_number: z.string().trim().max(50).nullable().optional(),
    legal_name: z.string().trim().max(255).nullable().optional(),
    logo_url: z.string().trim().max(3000000).refine(isImageOrUrl, 'Logo must be a valid image URL or uploaded file.').nullable().optional(),
    cover_image_url: z.string().trim().max(3000000).refine(isImageOrUrl, 'Cover image must be a valid image URL or uploaded file.').nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    google_maps_url: z.string().trim().max(2000).refine(isOptionalUrl, 'Google Maps link must be a valid URL.').nullable().optional(),
    whatsapp_number: z.string().trim().max(30).nullable().optional(),
    instagram_url: z.string().trim().max(2000).refine(isOptionalUrl, 'Instagram link must be a valid URL.').nullable().optional(),
    facebook_url: z.string().trim().max(2000).refine(isOptionalUrl, 'Facebook link must be a valid URL.').nullable().optional(),
    website_url: z.string().trim().max(2000).refine(isOptionalUrl, 'Website link must be a valid URL.').nullable().optional(),
    management_contact: z.string().trim().max(500).nullable().optional(),
    terms_and_conditions: z.string().trim().max(10000).nullable().optional(),
    privacy_policy: z.string().trim().max(10000).nullable().optional()
  }).partial(),
  params: z.object({}),
  query: z.object({})
});

const updateGymSettingsSchema = z.object({
  body: z.object({
    currency: z.literal('INR').default('INR').optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    date_format: z.enum(['DD MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY']).optional(),
    time_format: z.enum(['12', '24']).optional(),
    default_membership_duration: z.coerce.number().int().min(1).max(3650).optional(),
    default_payment_method: z.enum(['Cash', 'UPI', 'Card', 'Bank Transfer']).optional(),
    auto_generate_member_id: z.boolean().optional(),
    has_classes_enabled: z.boolean().optional(),
    favicon_url: z.string().trim().max(3000000).nullable().optional(),
    receipt_header: z.string().trim().max(255).nullable().optional(),
    receipt_footer: z.string().trim().max(1000).nullable().optional(),
    show_gym_logo: z.boolean().optional(),
    show_gst: z.boolean().optional(),
    show_address: z.boolean().optional(),
    show_contact_number: z.boolean().optional(),
    renewal_reminder: z.boolean().optional(),
    expiry_reminder: z.boolean().optional(),
    payment_confirmation: z.boolean().optional(),
    attendance_confirmation: z.boolean().optional(),
    operating_hours: operatingHoursSchema,
    whatsapp_number: z.string().trim().max(30).nullable().optional(),
    instagram_url: z.string().trim().max(2000).refine(isOptionalUrl, 'Instagram link must be a valid URL.').nullable().optional(),
    terms_and_conditions: z.string().trim().max(10000).nullable().optional(),
    management_contact: z.string().trim().max(500).nullable().optional()
  }).partial(),
  params: z.object({}),
  query: z.object({})
});

module.exports = { updateGymProfileSchema, updateGymSettingsSchema };
