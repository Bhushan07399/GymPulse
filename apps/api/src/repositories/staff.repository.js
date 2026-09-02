const { pool } = require('../db/pool');

const staffColumns = `
  id,
  gym_id,
  first_name,
  last_name,
  email,
  phone,
  role,
  is_active,
  created_at,
  updated_at
`;

const listStaff = async (gymId, { search, role, status } = {}) => {
  const values = [gymId];
  const conditions = ['gym_id = $1', 'deleted_at IS NULL'];

  if (role) {
    values.push(role);
    conditions.push(`role = $${values.length}`);
  }

  if (status === 'active') {
    conditions.push('is_active = TRUE');
  } else if (status === 'inactive') {
    conditions.push('is_active = FALSE');
  }

  if (search && String(search).trim()) {
    values.push(String(search).trim());
    const n = values.length;
    conditions.push(
      `(first_name ILIKE '%' || $${n} || '%' OR last_name ILIKE '%' || $${n} || '%' OR email ILIKE '%' || $${n} || '%' OR phone ILIKE '%' || $${n} || '%')`
    );
  }

  const query = `
    SELECT ${staffColumns}
    FROM staff
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows.map((row) => ({
    id: row.id,
    gymId: row.gym_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

const findStaffByEmail = async (email) => {
  const query = `SELECT id FROM staff WHERE LOWER(email) = LOWER($1) LIMIT 1`;
  const result = await pool.query(query, [email]);
  return result.rows[0] ?? null;
};

const findStaffById = async (gymId, staffId) => {
  const query = `
    SELECT ${staffColumns}
    FROM staff
    WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
    LIMIT 1
  `;
  const result = await pool.query(query, [staffId, gymId]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    gymId: row.gym_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const createStaffRecord = async ({ gymId, firstName, lastName, email, phone, passwordHash, role = 'Receptionist' }) => {
  const query = `
    INSERT INTO staff (gym_id, first_name, last_name, email, phone, password_hash, role, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    RETURNING ${staffColumns}
  `;
  const result = await pool.query(query, [gymId, firstName, lastName, email, phone, passwordHash, role]);
  const row = result.rows[0];

  return {
    id: row.id,
    gymId: row.gym_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at
  };
};

const updateStaffRecord = async (gymId, staffId, { firstName, lastName, email, phone, role }) => {
  const query = `
    UPDATE staff
    SET first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        role = COALESCE($5, role),
        updated_at = NOW()
    WHERE id = $6 AND gym_id = $7 AND deleted_at IS NULL
    RETURNING ${staffColumns}
  `;
  const result = await pool.query(query, [
    firstName ?? null,
    lastName ?? null,
    email ?? null,
    phone ?? null,
    role ?? null,
    staffId,
    gymId
  ]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    gymId: row.gym_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    updatedAt: row.updated_at
  };
};

const updateStaffStatusRecord = async (gymId, staffId, isActive) => {
  const query = `
    UPDATE staff
    SET is_active = $1, updated_at = NOW()
    WHERE id = $2 AND gym_id = $3 AND deleted_at IS NULL
    RETURNING ${staffColumns}
  `;
  const result = await pool.query(query, [Boolean(isActive), staffId, gymId]);
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    isActive: row.is_active,
    updatedAt: row.updated_at
  };
};

const softDeleteStaffRecord = async (gymId, staffId) => {
  const query = `
    UPDATE staff
    SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
    RETURNING id
  `;
  const result = await pool.query(query, [staffId, gymId]);
  return result.rows[0] ?? null;
};

const updateStaffPasswordRecord = async (gymId, staffId, passwordHash) => {
  const query = `
    UPDATE staff
    SET password_hash = $1, updated_at = NOW()
    WHERE id = $2 AND gym_id = $3 AND deleted_at IS NULL
    RETURNING id
  `;
  const result = await pool.query(query, [passwordHash, staffId, gymId]);
  return result.rows[0] ?? null;
};

module.exports = {
  listStaff,
  findStaffByEmail,
  findStaffById,
  createStaffRecord,
  updateStaffRecord,
  updateStaffStatusRecord,
  softDeleteStaffRecord,
  updateStaffPasswordRecord
};
