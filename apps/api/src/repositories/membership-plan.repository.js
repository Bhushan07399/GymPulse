const { pool } = require('../db/pool');

const membershipPlanColumns = `
  id,
  gym_id,
  plan_name,
  duration_in_days,
  price,
  description,
  is_active,
  created_at,
  updated_at`;

const createMembershipPlan = async ({
  gymId,
  planName,
  durationInDays,
  price,
  description,
  isActive
}) => {
  const result = await pool.query(
    `INSERT INTO membership_plans (
      gym_id,
      plan_name,
      duration_in_days,
      price,
      description,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      gym_id,
      plan_name,
      duration_in_days,
      price,
      description,
      is_active,
      created_at,
      updated_at`,
    [gymId, planName, durationInDays, price, description, isActive]
  );

  return result.rows[0];
};

const editableMembershipPlanColumns = Object.freeze({
  planName: 'plan_name',
  durationInDays: 'duration_in_days',
  price: 'price',
  description: 'description',
  isActive: 'is_active'
});

const listMembershipPlans = async (gymId, { page = 1, limit = 20, search, sortBy, order, status } = {}) => {
  const sortColumns = {
    createdAt: 'mp.created_at',
    planName: 'mp.plan_name',
    durationInDays: 'mp.duration_in_days',
    price: 'mp.price'
  };
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.max(Number(limit) || 20, 1);
  const offset = (pageNum - 1) * limitNum;
  const statusFilter = status
    ? `AND mp.is_active = ${status === 'active' ? 'TRUE' : 'FALSE'}`
    : '';
  const orderDirection = (order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const sortColumn = sortColumns[sortBy] || 'mp.created_at';

  const result = await pool.query(
    `SELECT
       mp.id,
       mp.gym_id,
       mp.plan_name,
       mp.duration_in_days,
       mp.price,
       mp.description,
       mp.is_active,
       mp.created_at,
       mp.updated_at,
       COUNT(DISTINCT m.id) FILTER (WHERE m.deleted_at IS NULL AND m.is_active = TRUE)::INTEGER AS members_count,
       COUNT(*) OVER() AS total_count
     FROM membership_plans mp
     LEFT JOIN members m ON m.membership_plan_id = mp.id
     WHERE mp.gym_id = $1
       AND mp.deleted_at IS NULL
       ${statusFilter}
       AND (
         $2::text IS NULL
         OR mp.plan_name ILIKE '%' || $2 || '%'
         OR mp.description ILIKE '%' || $2 || '%'
       )
     GROUP BY mp.id
     ORDER BY ${sortColumn} ${orderDirection}
     LIMIT $3 OFFSET $4`,
    [gymId, search ?? null, limitNum, offset]
  );

  return {
    items: result.rows.map(({ total_count: _totalCount, ...plan }) => plan),
    total: result.rows[0] ? Number(result.rows[0].total_count) : 0
  };
};

const updateMembershipPlanById = async (gymId, planId, changes) => {
  const updates = Object.entries(changes)
    .filter(([field, value]) => editableMembershipPlanColumns[field] && value !== undefined)
    .map(([field, value]) => ({ column: editableMembershipPlanColumns[field], value }));
  const values = updates.map(({ value }) => value);
  const assignments = updates
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ');

  values.push(planId, gymId);

  const result = await pool.query(
    `UPDATE membership_plans
     SET ${assignments}, updated_at = NOW()
     WHERE id = $${values.length - 1}
       AND gym_id = $${values.length}
       AND deleted_at IS NULL
     RETURNING ${membershipPlanColumns}`,
    values
  );

  return result.rows[0] ?? null;
};

const softDeleteMembershipPlan = async (gymId, planId) => {
  const result = await pool.query(
    `UPDATE membership_plans
     SET is_active = FALSE, deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [planId, gymId]
  );

  return result.rows[0] ?? null;
};

module.exports = {
  createMembershipPlan,
  listMembershipPlans,
  softDeleteMembershipPlan,
  updateMembershipPlanById
};
