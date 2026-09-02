const { pool } = require('../db/pool');

const editableProfileColumns = Object.freeze({
  name: 'name',
  owner_name: 'owner_name',
  phone: 'phone',
  email: 'email',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  pincode: 'pincode',
  gst_number: 'gst_number',
  logo_url: 'logo_url',
  cover_image_url: 'cover_image_url',
  description: 'description',
  google_maps_url: 'google_maps_url',
  whatsapp_number: 'whatsapp_number',
  instagram_url: 'instagram_url',
  facebook_url: 'facebook_url',
  website_url: 'website_url',
  legal_name: 'legal_name',
  management_contact: 'management_contact',
  terms_and_conditions: 'terms_and_conditions',
  privacy_policy: 'privacy_policy'
});

const findProfileById = async (gymId) => {
  const result = await pool.query(
    `SELECT
      name,
      owner_name,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      gst_number,
      logo_url,
      cover_image_url,
      description,
      google_maps_url,
      whatsapp_number,
      instagram_url,
      facebook_url,
      website_url,
      legal_name,
      management_contact,
      terms_and_conditions,
      privacy_policy,
      subscription_plan,
      subscription_start_date,
      subscription_end_date,
      is_active
    FROM gyms
    WHERE id = $1 AND deleted_at IS NULL
    LIMIT 1`,
    [gymId]
  );

  return result.rows[0] ?? null;
};

const updateProfileById = async (gymId, profile) => {
  const updates = Object.entries(profile)
    .filter(([field, value]) => editableProfileColumns[field] && value !== undefined)
    .map(([field, value]) => ({ column: editableProfileColumns[field], value }));

  if (updates.length === 0) {
    return findProfileById(gymId);
  }

  const values = updates.map(({ value }) => value);
  const assignments = updates
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ');

  values.push(gymId);

  const result = await pool.query(
    `UPDATE gyms
     SET ${assignments}, updated_at = NOW()
     WHERE id = $${values.length} AND deleted_at IS NULL
     RETURNING
       name,
       owner_name,
       email,
       phone,
       address,
       city,
       state,
       country,
       pincode,
       gst_number,
       logo_url,
       cover_image_url,
       description,
       google_maps_url,
       whatsapp_number,
       instagram_url,
       facebook_url,
       website_url,
       legal_name,
       management_contact,
       terms_and_conditions,
       privacy_policy,
       subscription_plan,
       subscription_start_date,
       subscription_end_date,
       is_active`,
    values
  );

  return result.rows[0] ?? null;
};

const getSettings = async (gymId) => {
  await pool.query('INSERT INTO gym_settings (gym_id) VALUES ($1) ON CONFLICT (gym_id) DO NOTHING', [gymId]);
  const result = await pool.query('SELECT * FROM gym_settings WHERE gym_id = $1', [gymId]);
  return result.rows[0];
};

const updateSettings = async (gymId, settings) => {
  await pool.query('INSERT INTO gym_settings (gym_id) VALUES ($1) ON CONFLICT (gym_id) DO NOTHING', [gymId]);
  const allowed = [
    'currency',
    'timezone',
    'date_format',
    'time_format',
    'default_membership_duration',
    'default_payment_method',
    'auto_generate_member_id',
    'favicon_url',
    'receipt_header',
    'receipt_footer',
    'show_gym_logo',
    'show_gst',
    'show_address',
    'show_contact_number',
    'renewal_reminder',
    'expiry_reminder',
    'payment_confirmation',
    'attendance_confirmation',
    'has_classes_enabled',
    'operating_hours',
    'whatsapp_number',
    'instagram_url',
    'terms_and_conditions',
    'management_contact'
  ];

  const entries = Object.entries(settings).filter(([key, value]) => allowed.includes(key) && value !== undefined);

  if (entries.length === 0) {
    return getSettings(gymId);
  }

  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
  values.push(gymId);

  const result = await pool.query(
    `UPDATE gym_settings SET ${assignments}, updated_at = NOW() WHERE gym_id = $${values.length} RETURNING *`,
    values
  );

  return result.rows[0];
};

module.exports = { findProfileById, updateProfileById, getSettings, updateSettings };
