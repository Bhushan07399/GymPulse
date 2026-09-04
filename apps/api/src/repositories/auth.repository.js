const { pool } = require('../db/pool');

const findStaffByEmail = async (email) => {
  const result = await pool.query(
    'SELECT id FROM staff WHERE email = $1 LIMIT 1',
    [email]
  );

  return result.rows[0] ?? null;
};

const findOwnerByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, gym_id, first_name, last_name, email, password_hash, role
     FROM staff
     WHERE LOWER(email) = LOWER($1)
       AND is_active = TRUE
       AND deleted_at IS NULL
     LIMIT 1`,
    [email]
  );

  return result.rows[0] ?? null;
};

const findGymById = async (gymId) => {
  const result = await pool.query(
    'SELECT id FROM gyms WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [gymId]
  );

  return result.rows[0] ?? null;
};

const createOwner = async ({ gymId, firstName, lastName, email, phone, passwordHash }) => {
  const result = await pool.query(
    `INSERT INTO staff (
      gym_id,
      first_name,
      last_name,
      email,
      phone,
      password_hash,
      role
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'Owner')
    RETURNING id, gym_id, first_name, last_name, email, phone, role, created_at`,
    [gymId, firstName, lastName, email, phone, passwordHash]
  );

  return result.rows[0];
};

const createGymWithOwner = async ({
  gymName,
  ownerFirstName,
  ownerLastName,
  email,
  phone,
  address,
  city,
  state,
  country,
  pincode,
  subscriptionPlan,
  passwordHash
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ownerFullName = `${ownerFirstName} ${ownerLastName}`;
    const gymQuery = `
      INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        trial_started_at, trial_ends_at, subscription_status, is_multi_gym, max_locations, billing_cycle
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', TRUE, NOW(), NOW() + INTERVAL '3 days', 'TRIAL', FALSE, 1, 'monthly')
      RETURNING id, name, subscription_plan, subscription_status, trial_started_at, trial_ends_at, is_multi_gym, max_locations, billing_cycle
    `;

    const gymResult = await client.query(gymQuery, [
      gymName,
      ownerFullName,
      email,
      phone || '0000000000',
      address || 'Gym Street',
      city || 'Metropolis',
      state || 'State',
      country || 'India',
      pincode || '400001',
      subscriptionPlan || 'Growth'
    ]);

    const gym = gymResult.rows[0];

    const staffQuery = `
      INSERT INTO staff (
        gym_id, first_name, last_name, email, phone, password_hash, role
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Owner')
      RETURNING id, gym_id, first_name, last_name, email, phone, role
    `;

    const staffResult = await client.query(staffQuery, [
      gym.id,
      ownerFirstName,
      ownerLastName,
      email,
      phone || '0000000000',
      passwordHash
    ]);

    const owner = staffResult.rows[0];

    await client.query('COMMIT');
    return { gym, owner };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getOwnerLocations = async (email) => {
  const result = await pool.query(
    `SELECT
       g.id,
       g.name,
       g.owner_name,
       g.email,
       g.phone,
       g.address,
       g.city,
       g.state,
       g.pincode,
       g.subscription_plan,
       g.subscription_status,
       g.is_multi_gym,
       g.max_locations,
       g.billing_cycle,
       g.trial_started_at,
       g.trial_ends_at,
       g.created_at,
       s.id AS staff_id
     FROM staff s
     JOIN gyms g ON s.gym_id = g.id
     WHERE LOWER(s.email) = LOWER($1)
       AND s.role = 'Owner'
       AND s.is_active = TRUE
       AND s.deleted_at IS NULL
       AND g.deleted_at IS NULL
     ORDER BY g.created_at ASC`,
    [email]
  );

  return result.rows;
};

const findOwnerStaffForGym = async (email, gymId) => {
  const result = await pool.query(
    `SELECT
       s.id,
       s.gym_id,
       s.first_name,
       s.last_name,
       s.email,
       s.phone,
       s.role,
       g.name AS gym_name,
       g.subscription_plan,
       g.subscription_status,
       g.is_multi_gym,
       g.max_locations,
       g.billing_cycle
     FROM staff s
     JOIN gyms g ON s.gym_id = g.id
     WHERE LOWER(s.email) = LOWER($1)
       AND s.gym_id = $2
       AND s.role = 'Owner'
       AND s.is_active = TRUE
       AND s.deleted_at IS NULL
       AND g.deleted_at IS NULL
     LIMIT 1`,
    [email, gymId]
  );

  return result.rows[0] ?? null;
};

const addGymLocationWithOwner = async ({
  ownerEmail,
  gymName,
  address,
  city,
  state,
  country,
  pincode,
  phone
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get primary owner details
    const primaryOwnerRes = await client.query(
      `SELECT first_name, last_name, phone, password_hash
       FROM staff
       WHERE LOWER(email) = LOWER($1) AND role = 'Owner' AND deleted_at IS NULL
       LIMIT 1`,
      [ownerEmail]
    );

    const primaryOwner = primaryOwnerRes.rows[0];
    if (!primaryOwner) {
      throw new Error('Owner record not found.');
    }

    // Get primary gym's subscription details to inherit
    const primaryGymRes = await client.query(
      `SELECT g.subscription_plan, g.subscription_status, g.subscription_start_date, g.subscription_end_date,
              g.is_multi_gym, g.max_locations, g.billing_cycle
       FROM staff s
       JOIN gyms g ON s.gym_id = g.id
       WHERE LOWER(s.email) = LOWER($1) AND s.role = 'Owner' AND g.deleted_at IS NULL
       ORDER BY g.created_at ASC
       LIMIT 1`,
      [ownerEmail]
    );
    const primaryGym = primaryGymRes.rows[0] || {};

    const ownerFullName = `${primaryOwner.first_name} ${primaryOwner.last_name}`;

    const gymQuery = `
      INSERT INTO gyms (
        name, owner_name, email, phone, address, city, state, country, pincode,
        subscription_plan, subscription_start_date, subscription_end_date, is_active,
        subscription_status, is_multi_gym, max_locations, billing_cycle
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, $13, TRUE, $14, $15)
      RETURNING id, name, city, subscription_plan, subscription_status, is_multi_gym, max_locations, billing_cycle, created_at
    `;

    const gymResult = await client.query(gymQuery, [
      gymName,
      ownerFullName,
      ownerEmail,
      phone || primaryOwner.phone || '0000000000',
      address || 'Gym Location',
      city || 'Main City',
      state || 'State',
      country || 'India',
      pincode || '400001',
      primaryGym.subscription_plan || 'Growth',
      primaryGym.subscription_start_date || new Date(),
      primaryGym.subscription_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      primaryGym.subscription_status || 'ACTIVE',
      primaryGym.max_locations || 5,
      primaryGym.billing_cycle || 'monthly'
    ]);

    const gym = gymResult.rows[0];

    const staffQuery = `
      INSERT INTO staff (
        gym_id, first_name, last_name, email, phone, password_hash, role
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Owner')
      RETURNING id, gym_id, first_name, last_name, email, phone, role
    `;

    const staffResult = await client.query(staffQuery, [
      gym.id,
      primaryOwner.first_name,
      primaryOwner.last_name,
      ownerEmail,
      phone || primaryOwner.phone || '0000000000',
      primaryOwner.password_hash
    ]);

    const owner = staffResult.rows[0];

    await client.query('COMMIT');
    return { gym, owner };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createOwner,
  createGymWithOwner,
  findGymById,
  findOwnerByEmail,
  findStaffByEmail,
  getOwnerLocations,
  findOwnerStaffForGym,
  addGymLocationWithOwner
};
