const { pool } = require('../db/pool');

const getWhatsAppSettings = async (gymId) => {
  const query = `
    SELECT gym_id, is_enabled, phone_number_id, business_account_id,
           welcome_enabled, payment_enabled, reminder_enabled, birthday_enabled,
           created_at, updated_at
    FROM whatsapp_settings
    WHERE gym_id = $1
  `;
  const result = await pool.query(query, [gymId]);
  if (result.rows[0]) {
    return result.rows[0];
  }

  // Default initial configuration
  return {
    gym_id: gymId,
    is_enabled: false,
    phone_number_id: null,
    business_account_id: null,
    welcome_enabled: true,
    payment_enabled: true,
    reminder_enabled: true,
    birthday_enabled: true,
    created_at: new Date(),
    updated_at: new Date()
  };
};

const saveWhatsAppSettings = async (gymId, data) => {
  const query = `
    INSERT INTO whatsapp_settings (
      gym_id, is_enabled, phone_number_id, business_account_id,
      welcome_enabled, payment_enabled, reminder_enabled, birthday_enabled,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (gym_id) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      phone_number_id = COALESCE(EXCLUDED.phone_number_id, whatsapp_settings.phone_number_id),
      business_account_id = COALESCE(EXCLUDED.business_account_id, whatsapp_settings.business_account_id),
      welcome_enabled = EXCLUDED.welcome_enabled,
      payment_enabled = EXCLUDED.payment_enabled,
      reminder_enabled = EXCLUDED.reminder_enabled,
      birthday_enabled = EXCLUDED.birthday_enabled,
      updated_at = NOW()
    RETURNING *
  `;
  const result = await pool.query(query, [
    gymId,
    Boolean(data.isEnabled ?? data.is_enabled),
    data.phoneNumberId || data.phone_number_id || null,
    data.businessAccountId || data.business_account_id || null,
    data.welcomeEnabled ?? data.welcome_enabled ?? true,
    data.paymentEnabled ?? data.payment_enabled ?? true,
    data.reminderEnabled ?? data.reminder_enabled ?? true,
    data.birthdayEnabled ?? data.birthday_enabled ?? true
  ]);
  return result.rows[0];
};

const hasDuplicateWhatsAppSentToday = async (gymId, memberId, automationType) => {
  if (!memberId) return false;
  const query = `
    SELECT id
    FROM whatsapp_logs
    WHERE gym_id = $1
      AND member_id = $2
      AND automation_type = $3
      AND sent_at >= CURRENT_DATE
      AND status IN ('SENT', 'SIMULATED_UNCONFIGURED')
    LIMIT 1
  `;
  const result = await pool.query(query, [gymId, memberId, automationType]);
  return Boolean(result.rows[0]);
};

const logWhatsAppDelivery = async ({
  gymId,
  memberId = null,
  automationType,
  phoneNumber,
  templateName,
  providerMessageId = null,
  status = 'SENT',
  errorMessage = null
}) => {
  const query = `
    INSERT INTO whatsapp_logs (
      gym_id, member_id, automation_type, phone_number,
      template_name, provider_message_id, status, error_message, sent_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING id, status, sent_at
  `;
  const result = await pool.query(query, [
    gymId,
    memberId,
    automationType,
    phoneNumber,
    templateName,
    providerMessageId,
    status,
    errorMessage
  ]);
  return result.rows[0];
};

const listWhatsAppLogs = async (gymId, limit = 50) => {
  const query = `
    SELECT wl.id, wl.gym_id, wl.member_id, wl.automation_type, wl.phone_number,
           wl.template_name, wl.provider_message_id, wl.status, wl.error_message, wl.sent_at,
           m.first_name, m.last_name
    FROM whatsapp_logs wl
    LEFT JOIN members m ON m.id = wl.member_id
    WHERE wl.gym_id = $1
    ORDER BY wl.sent_at DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [gymId, limit]);
  return result.rows;
};

const getAutomationSettings = async (gymId) => {
  const query = `
    SELECT id, gym_id, event_type, is_enabled, template_body, updated_at
    FROM automation_settings
    WHERE gym_id = $1
  `;
  const result = await pool.query(query, [gymId]);
  return result.rows;
};

const saveAutomationSetting = async (gymId, eventType, isEnabled, templateBody) => {
  const query = `
    INSERT INTO automation_settings (gym_id, event_type, is_enabled, template_body, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (gym_id, event_type) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      template_body = EXCLUDED.template_body,
      updated_at = NOW()
    RETURNING *
  `;
  const result = await pool.query(query, [gymId, eventType, Boolean(isEnabled), templateBody]);
  return result.rows[0];
};

const getGymBranding = async (gymId) => {
  const query = `
    SELECT g.id, g.name AS gym_name, g.logo_url, g.phone AS gym_phone, g.email, g.address,
           COALESCE(gs.whatsapp_number, g.whatsapp_number) AS whatsapp_number,
           COALESCE(gs.instagram_url, g.instagram_url) AS instagram_url,
           COALESCE(gs.terms_and_conditions, g.terms_and_conditions) AS terms_and_conditions,
           COALESCE(gs.management_contact, g.management_contact) AS management_contact,
           COALESCE(gs.fitbhuz_playstore_url, g.fitbhuz_playstore_url) AS fitbhuz_playstore_url,
           COALESCE(gs.fitbhuz_ios_url, g.fitbhuz_ios_url) AS fitbhuz_ios_url,
           COALESCE(gs.legal_name, g.legal_name) AS legal_name,
           COALESCE(gs.google_maps_url, g.google_maps_url) AS google_maps_url,
           COALESCE(gs.privacy_policy, g.privacy_policy) AS privacy_policy
    FROM gyms g
    LEFT JOIN gym_settings gs ON gs.gym_id = g.id
    WHERE g.id = $1 AND g.deleted_at IS NULL
  `;
  const result = await pool.query(query, [gymId]);
  return result.rows[0] || {
    id: gymId,
    gym_name: 'GymPulse Fitness',
    logo_url: null,
    gym_phone: '',
    email: '',
    address: '',
    whatsapp_number: '',
    instagram_url: '',
    terms_and_conditions: '',
    management_contact: '',
    legal_name: '',
    google_maps_url: '',
    privacy_policy: '',
    fitbhuz_playstore_url: 'https://play.google.com/store/apps/details?id=com.fitbhuz.member',
    fitbhuz_ios_url: 'https://apps.apple.com/app/fitbhuz/id123456789'
  };
};

const updateGymBranding = async (gymId, data) => {
  const query = `
    UPDATE gyms SET
      whatsapp_number = COALESCE($2, whatsapp_number),
      instagram_url = COALESCE($3, instagram_url),
      terms_and_conditions = COALESCE($4, terms_and_conditions),
      management_contact = COALESCE($5, management_contact),
      fitbhuz_playstore_url = COALESCE($6, fitbhuz_playstore_url),
      fitbhuz_ios_url = COALESCE($7, fitbhuz_ios_url),
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, name, whatsapp_number, instagram_url, terms_and_conditions, management_contact, fitbhuz_playstore_url, fitbhuz_ios_url
  `;
  const result = await pool.query(query, [
    gymId,
    data.whatsapp_number || data.whatsappNumber || null,
    data.instagram_url || data.instagramUrl || null,
    data.terms_and_conditions || data.termsAndConditions || null,
    data.management_contact || data.managementContact || null,
    data.fitbhuz_playstore_url || data.fitbhuzPlaystoreUrl || null,
    data.fitbhuz_ios_url || data.fitbhuzIosUrl || null
  ]);
  return result.rows[0];
};

const saveMemberClassSchedules = async (gymId, memberId, classId, classMembershipId, scheduleIds = []) => {
  await pool.query(
    'DELETE FROM member_class_schedules WHERE gym_id = $1 AND member_id = $2 AND class_id = $3',
    [gymId, memberId, classId]
  );
  if (!scheduleIds || scheduleIds.length === 0) return [];

  const rows = [];
  for (const sid of scheduleIds) {
    const res = await pool.query(
      `INSERT INTO member_class_schedules (gym_id, member_id, class_id, class_membership_id, schedule_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (gym_id, member_id, schedule_id) DO NOTHING
       RETURNING *`,
      [gymId, memberId, classId, classMembershipId || null, sid]
    );
    if (res.rows[0]) rows.push(res.rows[0]);
  }
  return rows;
};

const getMemberClassSchedules = async (gymId, memberId, classId = null) => {
  let query = `
    SELECT mcs.id, mcs.member_id, mcs.class_id, mcs.schedule_id,
           cs.day_of_week, cs.start_time, cs.end_time,
           c.name AS class_name, c.category AS class_category, c.instructor_name
    FROM member_class_schedules mcs
    JOIN class_schedules cs ON cs.id = mcs.schedule_id
    JOIN classes c ON c.id = mcs.class_id
    WHERE mcs.gym_id = $1 AND mcs.member_id = $2
  `;
  const params = [gymId, memberId];
  if (classId) {
    query += ` AND mcs.class_id = $3`;
    params.push(classId);
  }
  const result = await pool.query(query, params);
  return result.rows;
};

const getAffectedMembersForSchedule = async (gymId, classId, scheduleId) => {
  const query = `
    SELECT DISTINCT m.id, m.member_id, m.first_name, m.last_name, m.phone
    FROM members m
    JOIN member_class_schedules mcs ON mcs.member_id = m.id
    WHERE mcs.gym_id = $1 AND mcs.class_id = $2 AND mcs.schedule_id = $3 AND m.deleted_at IS NULL
  `;
  const result = await pool.query(query, [gymId, classId, scheduleId]);
  return result.rows;
};

const getAffectedMembersForClass = async (gymId, classId) => {
  const query = `
    SELECT DISTINCT m.id, m.member_id, m.first_name, m.last_name, m.phone
    FROM members m
    LEFT JOIN member_class_schedules mcs ON mcs.member_id = m.id
    LEFT JOIN class_memberships cm ON cm.member_id = m.id
    WHERE m.gym_id = $1 AND (mcs.class_id = $2 OR cm.class_id = $2) AND m.deleted_at IS NULL
  `;
  const result = await pool.query(query, [gymId, classId]);
  return result.rows;
};

const getAudienceMembers = async (gymId, audienceType, filter = {}) => {
  let query = `
    SELECT m.id, m.member_id, m.first_name, m.last_name, m.phone, m.is_active, m.expiry_date
    FROM members m
    WHERE m.gym_id = $1 AND m.deleted_at IS NULL
  `;
  const params = [gymId];

  if (audienceType === 'SELECTED' && filter.memberIds && filter.memberIds.length > 0) {
    query += ` AND m.id = ANY($2::uuid[])`;
    params.push(filter.memberIds);
  } else if (audienceType === 'PLAN' && filter.planId) {
    query += ` AND m.membership_plan_id = $2`;
    params.push(filter.planId);
  } else if (audienceType === 'CLASS' && filter.classId) {
    query += ` AND EXISTS (
      SELECT 1 FROM class_memberships cm WHERE cm.member_id = m.id AND cm.class_id = $2 AND cm.status = 'Active'
    )`;
    params.push(filter.classId);
  } else if (audienceType === 'EXPIRING') {
    query += ` AND m.is_active = TRUE AND m.expiry_date <= (CURRENT_DATE + INTERVAL '7 days') AND m.expiry_date >= CURRENT_DATE`;
  } else if (audienceType === 'OUTSTANDING') {
    query += ` AND EXISTS (
      SELECT 1 FROM payments p WHERE p.member_id = m.id AND p.gym_id = m.gym_id AND p.remaining_amount > 0
    )`;
  }

  const result = await pool.query(query, params);
  return result.rows;
};

const createManualBroadcast = async (gymId, { title, messageBody, mediaUrl, audienceType, audienceFilter, recipientCount }) => {
  const query = `
    INSERT INTO manual_broadcasts (gym_id, title, message_body, media_url, audience_type, audience_filter, recipient_count, status, sent_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED', NOW())
    RETURNING *
  `;
  const result = await pool.query(query, [
    gymId,
    title,
    messageBody,
    mediaUrl || null,
    audienceType,
    JSON.stringify(audienceFilter || {}),
    recipientCount
  ]);
  return result.rows[0];
};

const getBroadcastHistory = async (gymId, limit = 20) => {
  const query = `
    SELECT id, title, message_body, media_url, audience_type, recipient_count, status, sent_at
    FROM manual_broadcasts
    WHERE gym_id = $1
    ORDER BY sent_at DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [gymId, limit]);
  return result.rows;
};

const getAutomationStats = async (gymId) => {
  const totalRes = await pool.query('SELECT COUNT(*) FROM whatsapp_logs WHERE gym_id = $1', [gymId]);
  const sentRes = await pool.query("SELECT COUNT(*) FROM whatsapp_logs WHERE gym_id = $1 AND status IN ('SENT', 'DELIVERED', 'SIMULATED_UNCONFIGURED')", [gymId]);
  const failedRes = await pool.query("SELECT COUNT(*) FROM whatsapp_logs WHERE gym_id = $1 AND status = 'FAILED'", [gymId]);
  const todayRes = await pool.query('SELECT COUNT(*) FROM whatsapp_logs WHERE gym_id = $1 AND sent_at >= CURRENT_DATE', [gymId]);
  const monthRes = await pool.query("SELECT COUNT(*) FROM whatsapp_logs WHERE gym_id = $1 AND sent_at >= date_trunc('month', CURRENT_DATE)", [gymId]);

  return {
    total: parseInt(totalRes.rows[0].count, 10),
    sent: parseInt(sentRes.rows[0].count, 10),
    failed: parseInt(failedRes.rows[0].count, 10),
    today: parseInt(todayRes.rows[0].count, 10),
    month: parseInt(monthRes.rows[0].count, 10)
  };
};

module.exports = {
  getWhatsAppSettings,
  saveWhatsAppSettings,
  hasDuplicateWhatsAppSentToday,
  logWhatsAppDelivery,
  listWhatsAppLogs,
  getAutomationSettings,
  saveAutomationSetting,
  getGymBranding,
  updateGymBranding,
  saveMemberClassSchedules,
  getMemberClassSchedules,
  getAffectedMembersForSchedule,
  getAffectedMembersForClass,
  getAudienceMembers,
  createManualBroadcast,
  getBroadcastHistory,
  getAutomationStats
};
