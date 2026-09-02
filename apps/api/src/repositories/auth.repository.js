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
        subscription_plan, subscription_start_date, subscription_end_date, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', TRUE)
      RETURNING id, name, subscription_plan
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

module.exports = {
  createOwner,
  createGymWithOwner,
  findGymById,
  findOwnerByEmail,
  findStaffByEmail
};
