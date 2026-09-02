const { pool } = require('../db/pool');

const findExpiringMembersForGym = async (gymId, daysOffset) => {
  let dateClause = '';
  if (daysOffset > 0) {
    dateClause = `m.expiry_date = CURRENT_DATE + INTERVAL '${daysOffset} days'`;
  } else if (daysOffset < 0) {
    dateClause = `m.expiry_date = CURRENT_DATE - INTERVAL '${Math.abs(daysOffset)} days'`;
  } else {
    dateClause = `m.expiry_date = CURRENT_DATE`;
  }

  const query = `
    SELECT m.id AS member_id, m.gym_id, m.first_name, m.last_name, m.email, m.phone,
           m.expiry_date, mp.plan_name
    FROM members m
    LEFT JOIN membership_plans mp ON m.membership_plan_id = mp.id
    WHERE m.gym_id = $1
      AND m.deleted_at IS NULL
      AND ${dateClause}
  `;
  const result = await pool.query(query, [gymId]);
  return result.rows;
};

const hasDuplicateNotificationToday = async (gymId, memberId, notificationType, title) => {
  const query = `
    SELECT id
    FROM notifications
    WHERE gym_id = $1
      AND member_id = $2
      AND notification_type = $3
      AND title = $4
      AND sent_at >= CURRENT_DATE
      AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [gymId, memberId, notificationType, title]);
  return Boolean(result.rows[0]);
};

const createNotificationRecord = async ({
  gymId,
  memberId,
  staffId = null,
  notificationType,
  deliveryChannel = 'In-App',
  title,
  message,
  payload = null
}) => {
  const query = `
    INSERT INTO notifications (
      gym_id, member_id, staff_id, notification_type, delivery_channel,
      title, message, payload, is_read, sent_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())
    RETURNING id, title, sent_at
  `;
  const result = await pool.query(query, [
    gymId,
    memberId,
    staffId,
    notificationType,
    deliveryChannel,
    title,
    message,
    payload ? JSON.stringify(payload) : null
  ]);
  return result.rows[0];
};

const listActiveGymsWithSettings = async () => {
  const query = `
    SELECT g.id AS gym_id, g.name AS gym_name,
           COALESCE(gs.expiry_reminder, TRUE) AS expiry_reminder,
           COALESCE(gs.renewal_reminder, TRUE) AS renewal_reminder
    FROM gyms g
    LEFT JOIN gym_settings gs ON g.id = gs.gym_id
    WHERE g.is_active = TRUE AND g.deleted_at IS NULL
  `;
  const result = await pool.query(query);
  return result.rows;
};

module.exports = {
  findExpiringMembersForGym,
  hasDuplicateNotificationToday,
  createNotificationRecord,
  listActiveGymsWithSettings
};
